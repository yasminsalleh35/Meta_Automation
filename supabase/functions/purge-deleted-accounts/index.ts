// audit LGL-03: exclusão definitiva de contas após o prazo de 30 dias.
// hard_delete_pending_accounts() (SQL) não consegue apagar arquivos do Storage
// (trigger protect_objects_delete), então esta function, chamada pelo cron diário,
// remove primeiro os arquivos de cada conta via Storage API e depois roda o hard delete.
import { serviceClient, isCron } from '../_shared/auth.ts'
import { createLogger } from '../_shared/logger.ts'
import { toMessage } from '../_shared/errors.ts'

// audit PLT-06: logs estruturados (respostas inalteradas)
const log = createLogger('purge-deleted-accounts')

const BUCKETS = ['user-media', 'whatsapp-campaign-media']
const GRACE_DAYS = 30
const PAGE = 1000

type Db = ReturnType<typeof serviceClient>

// Lista recursivamente os arquivos sob <prefix>/ (pastas vêm com id null)
async function listFiles(db: Db, bucket: string, prefix: string): Promise<string[]> {
  const files: string[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: PAGE, offset })
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`)
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`
      if (item.id === null) files.push(...await listFiles(db, bucket, path))
      else files.push(path)
    }
    if (!data || data.length < PAGE) break
  }
  return files
}

async function purgeUserFiles(db: Db, userId: string): Promise<number> {
  let removed = 0
  for (const bucket of BUCKETS) {
    const files = await listFiles(db, bucket, userId)
    for (let i = 0; i < files.length; i += PAGE) {
      const { error } = await db.storage.from(bucket).remove(files.slice(i, i + PAGE))
      if (error) throw new Error(`remove ${bucket}/${userId}: ${error.message}`)
    }
    removed += files.length
  }
  return removed
}

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (!isCron(req)) return json({ success: false, error: 'forbidden' }, 401)

  const db = serviceClient()
  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: due, error } = await db
    .from('profiles')
    .select('id')
    .eq('status', 'pending_deletion')
    .lt('deletion_requested_at', cutoff)
  if (error) return json({ success: false, error: error.message }, 500)

  let filesRemoved = 0
  const fileErrors: string[] = []
  for (const { id } of due ?? []) {
    try {
      filesRemoved += await purgeUserFiles(db, id)
    } catch (e) {
      // não bloqueia a exclusão da conta; o erro fica no log para limpeza manual
      log.error('storage', 'storage error', { user_id: id, error: toMessage(e) })
      fileErrors.push(id)
    }
  }

  const { data: deleted, error: rpcError } = await db.rpc('hard_delete_pending_accounts')
  if (rpcError) return json({ success: false, error: rpcError.message, filesRemoved }, 500)

  log.info('handler', 'purge finished', { due: due?.length ?? 0, accountsDeleted: deleted, filesRemoved, fileErrors: fileErrors.length })
  return json({ success: true, due: due?.length ?? 0, accountsDeleted: deleted, filesRemoved, fileErrors })
})
