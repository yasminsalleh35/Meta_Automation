/**
 * Reads `?next=` from a query string and returns it only if it is a same-origin
 * app path (prevents open redirects such as `//evil.com` or `https://...`).
 */
export function getSafeNextPath(search: string, fallback = '/dashboard'): string {
  const next = new URLSearchParams(search).get('next');
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.startsWith('/auth/')) return fallback;
  return next;
}

export function buildLoginPath(pathname: string, search = '', hash = ''): string {
  const target = `${pathname}${search}${hash}`;
  if (!pathname || pathname === '/' || pathname.startsWith('/auth/')) return '/auth/login';
  return `/auth/login?next=${encodeURIComponent(target)}`;
}
