import { IMakeLoginPayload, IUserCreatePayload, IUserUpdatePayload } from '../store/auth/actions'
import { IAuthFull, ITokens, IUser } from '../store/auth/reducer'
import {
  TGetProjectsThunkArg,
  TGetProjectsResponse,
  TCreateProjectPayload,
  TCreateProjectResponse,
  TUpdateProjectPayload,
  TUpdateProjectResponse,
  TDeleteProjectResponse,
} from '../store/projects/actions'
import { IProject } from '../store/projects/reducer'

const ROOT = 'http://127.0.0.1:8000' as const
enum ENDPOINTS {
  // user & auth
  REGISTER = '/api/auth/register',
  LOGIN = '/api/auth/jwt/login',
  LOGOUT = '/api/auth/jwt/logout',
  ME = '/api/users/me',

  // projects
  PROJECTS = '/api/projects',

  /** DEBUG */
  ERROR = '/api/error',
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

  const res = await fetch(ROOT + ENDPOINTS.ME, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchUpdateUser = async (body: IUserUpdatePayload, auth: ITokens) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.ME, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchRegister = async (body: IUserCreatePayload) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchLogin = async (form: IMakeLoginPayload) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const body = new FormData()
  body.append('username', form.email) // NOTE `email` is used as `username` on login
  body.append('password', form.password)

  const res = await fetch(ROOT + ENDPOINTS.LOGIN, {
    method: 'POST',
    body: body,
    // body is formData (not JSON)
    // headers: default 'application/x-www-form-urlencoded' are used
  })
  return checkResponse<ILoginResponse>(res)
}

export const fetchLogout = async (auth: ITokens) => {
  if (!auth.access_token) return

  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: getAuthHeader(auth),
  })
  return checkResponse(res)
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export const fetchProjects = async (query: TGetProjectsThunkArg, auth: IAuthFull) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const urlParams = new URLSearchParams()
  if (query.is_deleted) urlParams.append('is_deleted', 'True')

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + urlParams, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TGetProjectsResponse>(res)
}

export const fetchCreateProject = async (body: TCreateProjectPayload, auth: IAuthFull) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<TCreateProjectResponse>(res)
}

export const fetchUpdateProject = async (
  id: IProject['id'],
  body: TCreateProjectPayload,
  auth: IAuthFull
) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + `/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<TUpdateProjectResponse>(res)
}

/** Mark for delete (a.k.a Archive) */
export const fetchDeleteProject = async (id: IProject['id'], auth: IAuthFull) => {
  await new Promise((r) => setTimeout(r, _DEBUG_TIMEOUT_MS)) // DEBUG

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + `/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TDeleteProjectResponse>(res)
}
