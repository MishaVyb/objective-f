import { Theme } from '../../packages/excalidraw/element/types'

export const LOCAL_DEV = true
export const MINUTE = 1000

export enum SCENE_PERSISTENCE {
  AUTO_SAVE_INTERVAL_MS = LOCAL_DEV ? MINUTE * 2 : MINUTE * 10,
  AUTO_LOADING_INTERVAL_MS = LOCAL_DEV ? MINUTE * 2 : MINUTE * 10,
}

export const ROOT = 'http://localhost:8000' as const
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

// TODO configure it from process.env
export const __DEBUG_API_FREEZE_MS = 250
export const __DEBUG_ENSURE_THEME: Theme | null = 'light' //'dark'

export const __DEBUG_EDITOR = false
// export const __DEBUG_EDITOR = true

export const __DEBUG_LOG_POINTER_CORDS = false
