import { IMakeLoginPayload, IUserUpdatePayload } from '../store/auth/actions'
import { IAuthFull, ITokens, IUser } from '../store/auth/reducer'

const ROOT = 'http://127.0.0.1:8000'
enum ENDPOINTS {
  REGISTER = `${ROOT}/api/auth/register`,
  LOGIN = `${ROOT}/api/auth/jwt/login`,
  LOGOUT = `${ROOT}/api/auth/jwt/logout`,
  ME = `${ROOT}/api/users/me`,

  /** DEBUG */
  ERROR = `${ROOT}/api/error`,
}

const _DEBUG_TIMEOUT_MS = 500

type IUserResponse = IUser
type ILoginResponse = ITokens

export const checkResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) return await response.json()
  return Promise.reject(response)
}

export const getAuthHeader = (auth: ITokens) => ({ Authorization: `Bearer ${auth.access_token}` })

export const fetchUser = async (auth: IAuthFull) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ENDPOINTS.ME, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchUpdateUser = async (body: IUserUpdatePayload, auth: ITokens) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ENDPOINTS.ME, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchLogin = async (body: IMakeLoginPayload) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    body: body, // formData (not JSON)
    // headers: default 'application/x-www-form-urlencoded' are used
  })
  return checkResponse<ILoginResponse>(res)
}

export const fetchLogout = async (auth: ITokens) => {
  if (!auth.access_token) return

  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: getAuthHeader(auth),
  })
  return checkResponse(res)
}
