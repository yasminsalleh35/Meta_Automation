// Audit ADM-05: exportação CSV segura.
// * aspas duplicadas ("") dentro do campo — antes uma aspa no nome quebrava as colunas
// * células que começam com = + - @ (ou tab / CR) recebem um ' na frente para o Excel/Sheets
//   não interpretarem como fórmula (CSV injection)

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (FORMULA_PREFIX.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
