export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDecimal(min: number, max: number, digits = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(digits));
}

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}


