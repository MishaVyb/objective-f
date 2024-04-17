import { objectEntries } from '../../objective/utils/types'

export enum LOCAL_STORAGE {
  AUTH = 'objective-beta:auth',
  PROJECTS = 'objective-beta:projects',
}

/** Save to local storage and **also** return the same value (easy to use at reducer) */
export function saveToLocalStorage<T>(key: string, value: T): T {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(e)
  }
  return value
}

export function loadFromLocalStorage<T>(key: string, fields: (keyof T)[], defaultValue: T): T {
  try {
    const fieldsSet = new Set(fields)
    const value = localStorage.getItem(key)
    if (value === null) return defaultValue

    //@ts-ignore
    return Object.fromEntries(
      objectEntries(JSON.parse(value)).filter(([k, v]) => fieldsSet.has(k as keyof T))
    )

  } catch (e) {
    console.warn(e)
    return defaultValue
  }
}

export function removeFromLocalStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(e)
  }
}
