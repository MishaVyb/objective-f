export const groupBy = <T extends Record<string, any>>(
  seq: readonly T[],
  field: keyof T
): Map<any, T[]> => {
  return seq.reduce((result, current) => {
    const key = current[field]
    if (!result.has(key)) result.set(key, [])
    const group = result.get(key)!
    group.push(current)
    return result
  }, new Map<T[typeof field], T[]>([]))
}

export const groupByV2 = <T extends Record<string, any>, K>(
  seq: readonly T[],
  predicate: (el: T) => K
): Map<K, T[]> => {
  return seq.reduce((result, current) => {
    const key = predicate(current)
    if (!result.has(key)) result.set(key, [])
    const group = result.get(key)!
    group.push(current)
    return result
  }, new Map<K, T[]>([]))
}

/**
 * return a negative value if the first argument is less than the second argument
 */
export const compareDates = (
  a: string | Date | null,
  b: string | Date | null,
  opts?: { desc?: boolean; nullFirst?: boolean }
) => {
  if (!a && !b) return 0
  if (typeof a === 'string') a = new Date(a)
  if (typeof b === 'string') b = new Date(b)

  if (!a) return opts?.nullFirst ? -1 : 1
  if (!b) return opts?.nullFirst ? 1 : -1

  if (opts?.desc) {
    return a < b ? 1 : a > b ? -1 : 0
  }
  return a < b ? -1 : a > b ? 1 : 0
}
