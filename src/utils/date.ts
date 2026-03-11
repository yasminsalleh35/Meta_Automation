export const monthLabelsPT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

export const currentMonthIndex = () => {
  const now = new Date();
  return now.getMonth(); // 0..11
};

// Gera array 12 posições com labels e oculta meses após o atual.
// Você poderá injetar valores reais depois (por ad account).
export const buildYearToDateMonths = (values: number[] = []) => {
  const cur = currentMonthIndex(); // 0..11
  return Array.from({ length: 12 }).map((_, i) => ({
    month: i + 1,
    label: monthLabelsPT[i],
    value: values[i] ?? 0,
    visible: i <= cur
  }));
};