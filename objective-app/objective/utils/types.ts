export type ValueOf<T> = T[keyof T]
export type Entries<T> = [keyof T, ValueOf<T>][]

/**
 * Iterate over Record items (key, value) with TS support.
 * @param obj
 * @returns
 */
export const objectEntries = <T extends object>(obj: T) => {
  return Object.entries(obj) as Entries<T>
}

/**
 * Iterate over Record keys with TS support.
 * @param obj
 * @returns
 */
export const objectKeys = <T extends object>(obj: T) => {
  return Object.keys(obj) as [keyof T]
}

/**
 * Iterate over Record values with TS support.
 * @param obj
 * @returns
 */
export const objectValues = <T extends object>(obj: T) => {
  return Object.values(obj) as [ValueOf<T>]
}

export const enumValueTypeGuardFactory =
  <T>(enumObject: T) =>
  (enumValue: any): enumValue is T[keyof T] =>
    //@ts-ignore
    Object.values(enumObject).includes(enumValue as T[keyof T])

export const enumKeyTypeGuardFactory =
  <T>(enumObject: T) =>
  (enumKey: any): enumKey is keyof T =>
    //@ts-ignore
    Object.keys(enumObject).includes(enumKey as keyof T)