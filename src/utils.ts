
export function allSame<T> (items: T[]): T|null {
  if (items.length < 2) return items[0] || null
  for (let i = 1; i < items.length; i++) {
    if (items[i] !== items[0]) return null
  }
  return items[0]
}

export function sum (...items: number[]): number {
  return items.reduce((acc, it) => acc + it, 0)
}

export function interset<T> (a: T[], b: T[]): T[] {
  const ret: T[] = []
  for (let i = 0; i < a.length; i++) {
    if (b.includes(a[i])) ret.push(a[i])
  }
  return ret
}

export function diff<T> (items: T[], getVal: (it: T) => number): {max: number; min: number; val: number} {
  const max = Math.max(...items.map(getVal))
  const min = Math.min(...items.map(getVal)) || 0
  const val = max - min
  return { max, min, val }
}
