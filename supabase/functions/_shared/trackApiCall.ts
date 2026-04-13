// Shared utility to track Meta API calls per user/hour
// Populates meta_api_usage table for the monitoring dashboard
// Fire-and-forget: never throws, never blocks the caller

export async function trackApiCall(
  supabase: any,
  userId: string,
  endpoint: string
): Promise<void> {
  try {
    const now = new Date();
    const hourBucket = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).toISOString();

    const { data: existing } = await supabase
      .from('meta_api_usage')
      .select('call_count, endpoints')
      .eq('user_id', userId)
      .eq('hour_bucket', hourBucket)
      .maybeSingle();

    if (existing) {
      const endpoints = existing.endpoints || {};
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;

      await supabase
        .from('meta_api_usage')
        .update({
          call_count: existing.call_count + 1,
          endpoints,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)
        .eq('hour_bucket', hourBucket);
    } else {
      await supabase
        .from('meta_api_usage')
        .insert({
          user_id: userId,
          hour_bucket: hourBucket,
          call_count: 1,
          endpoints: { [endpoint]: 1 },
        });
    }
  } catch (err) {
    console.warn('[trackApiCall] Failed to track API call (non-blocking):', err);
  }
}
