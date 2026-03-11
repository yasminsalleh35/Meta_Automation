export type NormalizedSelection = {
  primaryPageId: string | null;
  primaryInstagramId: string | null;
  primaryAdAccountId: string | null;
  allPageIds: string[];
  allInstagramIds: string[];
  allAdAccountIds: string[];
};

/** Lê seleção do usuário com fallback às colunas antigas */
export async function readNormalizedSelection(supabase: any, userId: string): Promise<NormalizedSelection> {
  const { data: integ } = await supabase
    .from('integrations')
    .select('page_id, ad_account_id, selected_page_ids, selected_instagram_ids, selected_ad_account_ids, selected_pages, selected_accounts, status, provider')
    .eq('user_id', userId)
    .in('provider', ['meta_ads','meta'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!integ) {
    return { primaryPageId: null, primaryInstagramId: null, primaryAdAccountId: null, allPageIds: [], allInstagramIds: [], allAdAccountIds: [] };
  }

  // páginas
  const pageIdsNew = Array.isArray(integ.selected_page_ids) ? integ.selected_page_ids : [];
  const pageIdsOld = Array.isArray(integ.selected_pages)
    ? integ.selected_pages.map((p: any) => p?.id).filter(Boolean)
    : [];
  const allPageIds = [...new Set([...(pageIdsNew || []), ...(pageIdsOld || []), integ.page_id].filter(Boolean))];

  // instagram
  const igIdsNew  = Array.isArray(integ.selected_instagram_ids) ? integ.selected_instagram_ids : [];
  const igFromOld = Array.isArray(integ.selected_accounts)
    ? integ.selected_accounts.filter((x: string) => /^\d{10,}$/.test(x))
    : [];
  const allInstagramIds = [...new Set([...(igIdsNew || []), ...igFromOld])];

  // ad accounts
  const adIdsNew  = Array.isArray(integ.selected_ad_account_ids) ? integ.selected_ad_account_ids : [];
  const adFromOld = Array.isArray(integ.selected_accounts)
    ? integ.selected_accounts.filter((x: string) => /^act_\d+$/.test(x))
    : [];
  const allAdAccountIds = [...new Set([...(adIdsNew || []), ...adFromOld, integ.ad_account_id].filter(Boolean))];

  return {
    primaryPageId: allPageIds[0] ?? null,
    primaryInstagramId: allInstagramIds[0] ?? null,
    primaryAdAccountId: allAdAccountIds[0] ?? null,
    allPageIds,
    allInstagramIds,
    allAdAccountIds,
  };
}