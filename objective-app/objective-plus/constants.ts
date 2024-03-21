import { Theme } from '../../packages/excalidraw/element/types'
import { getVersion } from '../../packages/excalidraw/utils'

export enum SCENE_PERSISTENCE {
  AUTO_SAVE_INTERVAL_MS = import.meta.env.DEV ? 1_000 * 2 : 1_000 * 10,
  AUTO_LOADING_INTERVAL_MS = import.meta.env.DEV ? 1_000 * 2 : 1_000 * 10,
}

export const ROOT = import.meta.env.VITE_APP_OBJECTIVE_HOST
export enum ENDPOINTS {
  // user & auth
  REGISTER = '/api/auth/register',
  LOGIN = '/api/auth/jwt/login',
  LOGOUT = '/api/auth/jwt/logout',
  ME = '/api/users/me',

  // projects
  PROJECTS = '/api/projects',
  SCENES = '/api/scenes',

  /** DEBUG */
  ERROR = '/api/error',
}

export const ACCENT_COLOR = 'violet' as const

export const __DEBUG_API_FREEZE_MS = Number(import.meta.env.VITE_APP_OBJECTIVE_API_FREEZE_MS || 0)
export const __DEBUG_ENSURE_THEME: Theme | null =
  import.meta.env.VITE_APP_OBJECTIVE_ENSURE_THEME || null
export const __DEBUG_EDITOR = Boolean(import.meta.env.VITE_APP_OBJECTIVE_FULL_EDITOR)
export const __DEBUG_LOG_POINTER_CORDS = Boolean(
  import.meta.env.VITE_APP_OBJECTIVE_LOG_POINTER_CORDS
)

export const APP_VERSION = getVersion()
