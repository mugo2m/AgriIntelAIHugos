export function now() {
  return new Date();
}

export function yearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}


