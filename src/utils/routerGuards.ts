export function isAuthRoute() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/auth' || p.startsWith('/auth/');
}