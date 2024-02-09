import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchCreateFile,
  fetchCreateProject,
  fetchCreateScene,
  fetchDeleteProject,
  fetchDeleteScene,
  fetchFile,
  fetchProjects,
  fetchScene,
  fetchScenes,
  fetchUpdateProject,
  fetchUpdateScene,
} from '../../utils/objective-api'
import { selectAuth } from '../auth/reducer'
import { ThunkApiConfig, safeAsyncThunk } from '../helpers'
import { IProject, ISceneFull } from './reducer'
import { BinaryFileData } from '../../../types'

// Responses
export type TGetProjectResponse = IProject
export type TGetProjectsResponse = IProject[]
export type TCreateProjectResponse = IProject
export type TUpdateProjectResponse = IProject
export type TDeleteProjectResponse = IProject

export type TGetSceneResponse = ISceneFull
export type TGetScenesResponse = ISceneFull[]
export type TCreateSceneResponse = ISceneFull
export type TUpdateSceneResponse = ISceneFull
export type TDeleteSceneResponse = ISceneFull

export type TGetFileResponse = Pick<BinaryFileData, 'id' | 'mimeType' | 'dataURL'>
export type TCreateFileResponse = Pick<BinaryFileData, 'id' | 'mimeType'>

// Payloads (query params, body, formData ...)
export type TQueryBase = {
  is_deleted?: boolean
}

export type TCreateProjectPayload = Pick<IProject, 'name'>
export type TUpdateProjectPayload = Pick<IProject, 'name'>

export type TCreateScenePayload = Pick<ISceneFull, 'name' | 'project_id' | 'appState' | 'elements'>
export type TUpdateScenePayload = Partial<
  Pick<
    ISceneFull,
    | 'name'
    | 'project_id'
    // Excalidraw Data:
    | 'source'
    | 'version'
    | 'type'
    | 'appState'
    | 'elements'
  >
>

// Thunk args (payloads + any extra arguments)
export type TGetProjectsThunkArg = TQueryBase
export type TCreateProjectThunkArg = TCreateProjectPayload
export type TUpdateProjectThunkArg = TUpdateProjectPayload & Pick<IProject, 'id'>
export type TDeleteProjectThunkArg = Pick<IProject, 'id'>

export type TGetSceneThunkArg = Pick<ISceneFull, 'id'>
export type TGetScenesThunkArg = TQueryBase
export type TCreateSceneThunkArg = TCreateScenePayload
export type TUpdateSceneThunkArg = TUpdateScenePayload & Pick<ISceneFull, 'id'>
export type TDeleteSceneThunkArg = Pick<ISceneFull, 'id'>

export type TGetFileThunkArg = {
  sceneId: ISceneFull['id']
  fileId: BinaryFileData['id']
}
export type TCreateFileThunkArg = {
  sceneId: ISceneFull['id']
  file: BinaryFileData
}

export type TAuthAsyncThunk = AsyncThunk<
  //
  // Returned: request Response
  | TGetProjectsResponse
  | TGetProjectsResponse
  | TCreateProjectResponse
  | TUpdateProjectResponse
  | TDeleteProjectResponse
  //
  | TGetScenesResponse
  | TGetScenesResponse
  | TCreateSceneResponse
  | TUpdateSceneResponse
  | TDeleteSceneResponse,
  //
  // ThunkArg: request Body / request URL params / all other necessary for making request
  | TGetProjectsThunkArg
  | TCreateProjectThunkArg
  | TUpdateProjectThunkArg
  //
  | TGetSceneThunkArg
  | TGetScenesThunkArg
  | TCreateSceneThunkArg
  | TUpdateSceneThunkArg
  //
  | TGetFileThunkArg
  | TCreateFileThunkArg,
  //
  // Config types:
  ThunkApiConfig
>

export type TPendingAction = ReturnType<TAuthAsyncThunk['pending']>
export type TRejectedAction = ReturnType<TAuthAsyncThunk['rejected']>
export type TFulfilledAction = ReturnType<TAuthAsyncThunk['fulfilled']>

export const resetRequestStatusAction = createAction('projects/resetRequestStatusAction')
export type TResetRequestStatusAction = ReturnType<typeof resetRequestStatusAction>

export const toggleProject = createAction<IProject['id']>('projects/toggleProject')
export type TToggleProject = ReturnType<typeof toggleProject>

export const loadProjects = createAsyncThunk<
  TGetProjectsResponse,
  TGetProjectsThunkArg,
  ThunkApiConfig
>('projects/loadProjects', (query, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchProjects(query, selectAuth(thunkApi.getState())))
)

export const loadCreateProject = createAsyncThunk<
  TCreateProjectResponse,
  TCreateProjectThunkArg,
  ThunkApiConfig
>('projects/loadCreateProject', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCreateProject(arg, selectAuth(thunkApi.getState())))
)

export const loadUpdateProject = createAsyncThunk<
  TUpdateProjectResponse,
  TUpdateProjectThunkArg,
  ThunkApiConfig
>('projects/loadUpdateProject', ({ id, name }, thunkApi) =>
  safeAsyncThunk(thunkApi, () =>
    fetchUpdateProject(id, { name: name }, selectAuth(thunkApi.getState()))
  )
)

export const loadDeleteProject = createAsyncThunk<
  TDeleteProjectResponse,
  TDeleteProjectThunkArg,
  ThunkApiConfig
>('projects/loadDeleteProject', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchDeleteProject(id, selectAuth(thunkApi.getState())))
)

////////////////////////////////////////////////////////////////////////////////////////////////////

export const loadScenes = createAsyncThunk<TGetScenesResponse, TGetScenesThunkArg, ThunkApiConfig>(
  'projects/loadScenes',
  (query, thunkApi) =>
    safeAsyncThunk(thunkApi, () => fetchScenes(query, selectAuth(thunkApi.getState())))
)

export const loadSceneInitial = createAsyncThunk<
  TGetSceneResponse,
  TGetSceneThunkArg,
  ThunkApiConfig
>('projects/loadSceneInitial', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchScene(arg.id, selectAuth(thunkApi.getState())))
)

export const loadSceneContinuos = createAsyncThunk<
  TGetSceneResponse,
  TGetSceneThunkArg,
  ThunkApiConfig
>('projects/loadSceneContinuous', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchScene(arg.id, selectAuth(thunkApi.getState())))
)

export const loadCreateScene = createAsyncThunk<
  TCreateSceneResponse,
  TCreateSceneThunkArg,
  ThunkApiConfig
>('projects/loadCreateScene', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCreateScene(arg, selectAuth(thunkApi.getState())))
)

export const loadUpdateScene = createAsyncThunk<
  TUpdateSceneResponse,
  TUpdateSceneThunkArg,
  ThunkApiConfig
>('projects/loadUpdateScene', ({ id, ...payload }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchUpdateScene(id, payload, selectAuth(thunkApi.getState())))
)

export const loadDeleteScene = createAsyncThunk<
  TDeleteSceneResponse,
  TDeleteSceneThunkArg,
  ThunkApiConfig
>('projects/loadDeleteScene', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchDeleteScene(id, selectAuth(thunkApi.getState())))
)

export const loadFile = createAsyncThunk<TGetFileResponse, TGetFileThunkArg, ThunkApiConfig>(
  'projects/loadFile',
  (arg, thunkApi) =>
    safeAsyncThunk(thunkApi, () =>
      fetchFile(arg.sceneId, arg.fileId, selectAuth(thunkApi.getState()))
    )
)

export const createFile = createAsyncThunk<
  TCreateFileResponse,
  TCreateFileThunkArg,
  ThunkApiConfig
>('projects/createFile', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () =>
    fetchCreateFile(arg.sceneId, arg.file, selectAuth(thunkApi.getState()))
  )
)
