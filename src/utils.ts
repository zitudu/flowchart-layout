
export function allSame<T>(items: T[]): T|null {
  if (items.length < 2) return items[0] || null
  for (let i = 1; i < items.length; i++) {
    if (items[i] !== items[0]) return null
  }
  return items[0]
}

export function sum(...items: number[]): number {
  return items.reduce((acc, it) => acc + it, 0)
}
