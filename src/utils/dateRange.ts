export const getLast90dRange = () => {
  const until = new Date();
  const since = new Date();
  since.setDate(until.getDate() - 90);
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { since: iso(since), until: iso(until) };
};