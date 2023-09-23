export type ValueOf<T> = T[keyof T]
export type Entries<T> = [keyof T, ValueOf<T>][]

/**
 * Iterate over Record with TS support.
 * @param obj
 * @returns
 */
export const objectEntries = <T extends object>(obj: T): Entries<T> => {
  return Object.entries(obj) as Entries<T>
}
