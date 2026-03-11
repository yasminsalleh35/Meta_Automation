export const toMessage = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

export const toObject = (e: unknown): Record<string, unknown> =>
  e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } :
  typeof e === 'object' && e !== null ? e as Record<string, unknown> :
  { value: e };