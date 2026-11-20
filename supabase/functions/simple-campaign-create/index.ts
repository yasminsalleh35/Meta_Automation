// simple-campaign-create — HTTP entry point. A lógica vive em ./core.ts (compartilhada com o bot do WhatsApp).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleRequest } from './core.ts';

export * from './core.ts';

// Start the HTTP server in production exactly as before. Tests set SCC_DISABLE_SERVE=1 before
// importing this module so they can call `handleRequest` directly without binding a port.
// (Default = unset → serve runs, so production behavior is unchanged.)
if (!Deno.env.get('SCC_DISABLE_SERVE')) {
  serve(handleRequest);
}
