export const AUTH_LOCAL_STORAGE_KEY = 'objective-plus-auth'

export function saveToLocalStorage<T>(key: string, value: T): T {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(e)
  }
  return value
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T | undefined = undefined): T | undefined {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return defaultValue
    return JSON.parse(value)
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
