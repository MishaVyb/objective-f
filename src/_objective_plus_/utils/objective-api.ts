import { BinaryFileData } from '../../types'
import { API_MOCK_FREEZE_MS, ENDPOINTS, LOCAL_DEV, ROOT } from '../constants'
import { IMakeLoginPayload, IUserCreatePayload, IUserUpdatePayload } from '../store/auth/actions'
import { IAuthFull, ITokens, IUser } from '../store/auth/reducer'
import {
  TCreateFileResponse,
  TCreateProjectPayload,
  TCreateProjectResponse,
  TCreateScenePayload,
  TCreateSceneResponse,
  TDeleteProjectResponse,
  TDeleteSceneResponse,
  TGetFileResponse,
  TGetProjectsResponse,
  TGetProjectsThunkArg,
  TGetSceneResponse,
  TGetScenesResponse,
  TGetScenesThunkArg,
  TUpdateProjectResponse,
  TUpdateScenePayload,
  TUpdateSceneResponse,
} from '../store/projects/actions'
import { IProject, ISceneFull } from '../store/projects/reducer'

type IUserResponse = IUser
type ILoginResponse = ITokens

export const checkResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) return null as T // no content
    return await response.json()
  }

  return Promise.reject(response)
}

export const getAuthHeader = (auth: ITokens) => ({ Authorization: `Bearer ${auth.access_token}` })

export const fetchUser = async (auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.ME, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchUpdateUser = async (body: IUserUpdatePayload, auth: ITokens) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.ME, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchRegister = async (body: IUserCreatePayload) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return await checkResponse<IUserResponse>(res)
}

export const fetchLogin = async (form: IMakeLoginPayload) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

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

  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: getAuthHeader(auth),
  })
  return checkResponse(res)
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export const fetchProjects = async (query: TGetProjectsThunkArg, auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const urlParams = new URLSearchParams()
  if (query.is_deleted) urlParams.append('is_deleted', 'True')

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + urlParams, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TGetProjectsResponse>(res)
}

export const fetchCreateProject = async (body: TCreateProjectPayload, auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

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
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + `/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<TUpdateProjectResponse>(res)
}

/** Mark for delete (a.k.a Archive) */
export const fetchDeleteProject = async (id: IProject['id'], auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.PROJECTS + `/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TDeleteProjectResponse>(res)
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export const fetchScene = async (id: ISceneFull['id'], auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES + `/${id}`, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TGetSceneResponse>(res)
}

export const fetchScenes = async (query: TGetScenesThunkArg, auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const urlParams = new URLSearchParams()
  if (query.is_deleted) urlParams.append('is_deleted', 'True')

  const res = await fetch(ROOT + ENDPOINTS.SCENES + urlParams, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TGetScenesResponse>(res)
}

export const fetchCreateScene = async (body: TCreateScenePayload, auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<TCreateSceneResponse>(res)
}

export const fetchUpdateScene = async (
  id: ISceneFull['id'],
  body: TUpdateScenePayload,
  auth: IAuthFull
) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES + `/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
    body: JSON.stringify(body),
  })
  return await checkResponse<TUpdateSceneResponse>(res)
}

/** Mark for delete (a.k.a Archive) */
export const fetchDeleteScene = async (id: ISceneFull['id'], auth: IAuthFull) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES + `/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TDeleteSceneResponse>(res)
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export const fetchFile = async (
  sceneId: ISceneFull['id'],
  fileId: BinaryFileData['id'],
  auth: IAuthFull
) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES + `/${sceneId}/files/${fileId}`, {
    method: 'GET',
    headers: getAuthHeader(auth),
  })
  return await checkResponse<TGetFileResponse>(res)
}

export const fetchCreateFile = async (
  sceneId: ISceneFull['id'],
  file: BinaryFileData,
  auth: IAuthFull
) => {
  if (LOCAL_DEV) await new Promise((r) => setTimeout(r, API_MOCK_FREEZE_MS))

  const res = await fetch(ROOT + ENDPOINTS.SCENES + `/${sceneId}/files`, {
    method: 'POST',
    body: JSON.stringify(file),
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(auth) },
  })
  return await checkResponse<TCreateFileResponse>(res)
}
