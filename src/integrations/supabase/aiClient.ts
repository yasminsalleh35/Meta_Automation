// Re-export the main client — avoids creating a duplicate GoTrueClient instance.
// The main client already has a 60s timeout which covers AI operations.
export { supabase as supabaseAI } from './client';
