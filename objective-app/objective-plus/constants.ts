export const LOCAL_DEV = true
export const MINUTE = 1000

export enum SCENE_PERSISTENCE {
  AUTO_SAVE_INTERVAL_MS = LOCAL_DEV ? MINUTE * 2 : MINUTE * 10,
  AUTO_LOADING_INTERVAL_MS = LOCAL_DEV ? MINUTE * 2 : MINUTE * 10,
}

export const ROOT = 'http://127.0.0.1:8000' as const
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

export const API_MOCK_FREEZE_MS = 250
