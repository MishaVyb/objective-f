export const groupBy = <T extends Record<string, any>>(
  seq: T[],
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
