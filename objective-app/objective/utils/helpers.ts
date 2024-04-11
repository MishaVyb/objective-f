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