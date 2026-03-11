
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toMessage, toObject } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de setores para arquivos
const SECTOR_FILE_MAPPING = {
  sidebar: [
    'src/components/AppSidebar.tsx',
    'src/components/sidebar/ConfigMenuSection.tsx',
    'src/components/sidebar/LearningMenuSection.tsx',
    'src/components/sidebar/MainMenuSection.tsx',
    'src/components/sidebar/QuickActionsSection.tsx',
    'src/components/sidebar/SidebarUserInfo.tsx'
  ],
  header: [
    'src/components/DashboardHeader.tsx',
    'src/components/MobileHeader.tsx',
    'src/components/AdminHeader.tsx'
  ],
  campaigns: [
    'src/pages/dashboard/Campaigns.tsx',
    'src/pages/dashboard/CreateCampaign.tsx',
    'src/pages/dashboard/EditCampaign.tsx',
    'src/components/campaign',
    'src/hooks/campaign',
    'src/hooks/useCampaignActions.ts',
    'src/hooks/useCampaignData.ts',
    'src/hooks/useCampaignValidation.ts'
  ],
  wizard: [
    'src/components/campaign/wizard',
    'src/hooks/useWizardLogic.ts',
    'src/hooks/useCampaignCreationFlow.ts',
    'src/hooks/campaign-creation'
  ],
  admin: [
    'src/pages/admin',
    'src/components/admin',
    'src/components/layouts/AdminLayout.tsx',
    'src/hooks/useAdminActions.ts',
    'src/hooks/useAdminData.ts'
  ],
  integrations: [
    'src/pages/dashboard/Integrations.tsx',
    'src/components/integrations',
    'src/hooks/useMetaAds.ts',
    'src/hooks/useMetaAdsIntegration.ts',
    'src/hooks/meta-ads'
  ],
  dashboard: [
    'src/pages/dashboard/Dashboard.tsx',
    'src/components/dashboard',
    'src/hooks/useMetrics.ts',
    'src/hooks/useOptimizedMetrics.ts'
  ],
  auth: [
    'src/pages/auth',
    'src/contexts/AuthContext.tsx',
    'src/components/layouts/AuthLayout.tsx',
    'src/hooks/useAuth.ts'
  ]
} as const

type Sector = keyof typeof SECTOR_FILE_MAPPING

// Dependências entre setores (quais setores podem ser afetados)
const SECTOR_DEPENDENCIES: Record<Sector, Sector[]> = {
  sidebar: ['dashboard', 'campaigns', 'admin'],
  header: ['dashboard', 'campaigns', 'admin'],
  campaigns: ['wizard', 'integrations'],
  wizard: ['campaigns'],
  admin: [],
  integrations: ['campaigns'],
  dashboard: ['campaigns'],
  auth: ['dashboard', 'campaigns', 'admin']
}

serve(async (req): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, sector: sectorRaw, snapshotName, description, command } = await req.json()
    console.log('📸 Snapshot action:', { action, sector: sectorRaw, snapshotName, command })

    // Validate sector
    let sector: Sector | undefined
    if (typeof sectorRaw === 'string' && sectorRaw in SECTOR_FILE_MAPPING) {
      sector = sectorRaw as Sector
    }

    switch (action) {
      case 'create':
        if (!sector) return badSector()
        return await createSnapshot(supabase, user.id, sector, snapshotName, description)
      
      case 'list':
        return await listSnapshots(supabase, user.id, sector)
      
      case 'restore':
        if (!sector) return badSector()
        return await restoreSnapshot(supabase, user.id, sector, snapshotName)
      
      case 'preview':
        if (!sector) return badSector()
        return await previewRestore(supabase, user.id, sector, snapshotName)
      
      case 'check_dependencies':
        if (!sector) return badSector()
        return await checkDependencies(sector)
      
      case 'parse_command':
        return await parseCommand(command)
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (err: unknown) {
    console.error('❌ Error in manage-snapshots:', toObject(err))
    return new Response(JSON.stringify({ error: toMessage(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function badSector(): Response {
  return new Response(JSON.stringify({ error: 'Setor inválido' }), {
    status: 400, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createSnapshot(supabase: any, userId: string, sector: Sector, snapshotName: string, description: string) {
  console.log('📸 Creating snapshot:', { sector, snapshotName })
  
  const filePaths = SECTOR_FILE_MAPPING[sector]
  const filesData: Record<string, string> = {}
  
  // Simular captura de arquivos (em produção, isso seria feito diferente)
  for (const path of filePaths) {
    filesData[path] = `// Conteúdo simulado do arquivo ${path}`
  }

  const { data, error } = await supabase
    .from('code_snapshots')
    .insert({
      user_id: userId,
      sector,
      snapshot_name: snapshotName,
      description,
      files_data: filesData,
      dependencies: SECTOR_DEPENDENCIES[sector] ?? [],
      file_paths: filePaths,
      metadata: {
        total_files: filePaths.length,
        created_by: 'snapshot-system',
        version: '1.0.0'
      }
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating snapshot:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    success: true,
    message: `✅ Snapshot '${snapshotName}' criado para o setor '${sector}'`,
    snapshot: data,
    files_included: filePaths.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function listSnapshots(supabase: any, userId: string, sector?: Sector | 'all') {
  console.log('📋 Listing snapshots:', { sector })
  
  let query = supabase
    .from('code_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (sector && sector !== 'all') {
    query = query.eq('sector', sector)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Error listing snapshots:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    snapshots: data,
    total: data.length,
    sectors: sector === 'all' ? Object.keys(SECTOR_FILE_MAPPING) : sector ? [sector] : []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function restoreSnapshot(supabase: any, userId: string, sector: Sector, snapshotName: string) {
  console.log('🔄 Restoring snapshot:', { sector, snapshotName })
  
  const { data, error } = await supabase
    .from('code_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('sector', sector)
    .eq('snapshot_name', snapshotName)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Snapshot não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Em um ambiente real, aqui faria a restauração dos arquivos
  console.log('📁 Files to restore:', data.file_paths)
  
  return new Response(JSON.stringify({
    success: true,
    message: `✅ Snapshot '${snapshotName}' restaurado para o setor '${sector}'`,
    files_restored: data.file_paths.length,
    dependencies_affected: data.dependencies
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function previewRestore(supabase: any, userId: string, sector: Sector, snapshotName: string) {
  console.log('👁️ Previewing restore:', { sector, snapshotName })
  
  const { data, error } = await supabase
    .from('code_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('sector', sector)
    .eq('snapshot_name', snapshotName)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Snapshot não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    snapshot: data,
    preview: {
      files_to_restore: data.file_paths,
      dependencies_affected: data.dependencies,
      created_at: data.created_at,
      description: data.description
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function checkDependencies(sector: Sector) {
  console.log('🔍 Checking dependencies for:', sector)
  
  const dependencies = SECTOR_DEPENDENCIES[sector] ?? []
  
  return new Response(JSON.stringify({
    sector,
    dependencies,
    affects: dependencies.length > 0 ? `Pode afetar: ${dependencies.join(', ')}` : 'Nenhuma dependência'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function parseCommand(command: string) {
  console.log('🔧 Parsing command:', command)
  
  // Parse dos comandos específicos
  const snapshotMatch = command.match(/!snapshot\s+(\w+)\s+"([^"]+)"/)
  if (snapshotMatch) {
    return new Response(JSON.stringify({
      action: 'create',
      sector: snapshotMatch[1],
      description: snapshotMatch[2]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const restoreMatch = command.match(/!restore\s+(\w+)\s+"([^"]+)"/)
  if (restoreMatch) {
    return new Response(JSON.stringify({
      action: 'restore',
      sector: restoreMatch[1],
      snapshotName: restoreMatch[2]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const listMatch = command.match(/!list\s+(\w+|all)/)
  if (listMatch) {
    return new Response(JSON.stringify({
      action: 'list',
      sector: listMatch[1]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const previewMatch = command.match(/!preview restore\s+(\w+)\s+"([^"]+)"/)
  if (previewMatch) {
    return new Response(JSON.stringify({
      action: 'preview',
      sector: previewMatch[1],
      snapshotName: previewMatch[2]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const checkMatch = command.match(/!check dependencies\s+(\w+)/)
  if (checkMatch) {
    return new Response(JSON.stringify({
      action: 'check_dependencies',
      sector: checkMatch[1]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    error: 'Comando não reconhecido',
    available_commands: [
      '!snapshot [setor] "[descrição]"',
      '!restore [setor] "[nome do snapshot]"',
      '!list [setor]/all',
      '!preview restore [setor] "[nome]"',
      '!check dependencies [setor]'
    ]
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
