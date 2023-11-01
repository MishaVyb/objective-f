import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { IProject } from './reducer'
import { ThunkApiConfig, safeAsyncThunk } from '../helpers'
import {
  fetchCreateProject,
  fetchDeleteProject,
  fetchProjects,
  fetchUpdateProject,
} from '../../utils/objective-api'
import { selectAuth } from '../auth/reducer'

// Responses
export type TGetProjectResponse = IProject
export type TGetProjectsResponse = IProject[]
export type TCreateProjectResponse = IProject
export type TUpdateProjectResponse = IProject
export type TDeleteProjectResponse = IProject

// Payloads (query params, body, formData ...)
export type TQueryBase = {
  is_deleted?: boolean
}

export type TCreateProjectPayload = Pick<IProject, 'name'>
export type TUpdateProjectPayload = Pick<IProject, 'name'>

// Thunk args (payloads + any extra arguments)
export type TGetProjectsThunkArg = TQueryBase
export type TCreateProjectThunkArg = TCreateProjectPayload & Pick<IProject, 'id'>
export type TUpdateProjectThunkArg = TUpdateProjectPayload & Pick<IProject, 'id'>
export type TDeleteProjectThunkArg = Pick<IProject, 'id'>

export type TAuthAsyncThunk = AsyncThunk<
  //
  // Returned: request Response
  | TGetProjectsResponse
  | TGetProjectsResponse
  | TCreateProjectResponse
  | TUpdateProjectResponse
  | TDeleteProjectResponse,
  //
  // ThunkArg: request Body / request URL params / all other necessary for making request
  TGetProjectsThunkArg | TCreateProjectThunkArg | TUpdateProjectThunkArg,
  //
  // Config types:
  ThunkApiConfig
>

export type TPendingAction = ReturnType<TAuthAsyncThunk['pending']>
export type TRejectedAction = ReturnType<TAuthAsyncThunk['rejected']>
export type TFulfilledAction = ReturnType<TAuthAsyncThunk['fulfilled']>

export const resetRequestStatusAction = createAction('projects/resetRequestStatusAction')
export type TResetRequestStatusAction = ReturnType<typeof resetRequestStatusAction>

export const loadProjects = createAsyncThunk<
  TGetProjectsResponse,
  TGetProjectsThunkArg,
  ThunkApiConfig
>('auth/loadProjects', (query, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchProjects(query, selectAuth(thunkApi.getState())))
)

export const loadCreateProject = createAsyncThunk<
  TCreateProjectResponse,
  TCreateProjectThunkArg,
  ThunkApiConfig
>('auth/loadCreateProject', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCreateProject(arg, selectAuth(thunkApi.getState())))
)

export const loadUpdateProject = createAsyncThunk<
  TUpdateProjectResponse,
  TUpdateProjectThunkArg,
  ThunkApiConfig
>('auth/loadUpdateProject', ({ id, name }, thunkApi) =>
  safeAsyncThunk(thunkApi, () =>
    fetchUpdateProject(id, { name: name }, selectAuth(thunkApi.getState()))
  )
)

export const loadDeleteProject = createAsyncThunk<
  TDeleteProjectResponse,
  TDeleteProjectThunkArg,
  ThunkApiConfig
>('auth/loadDeleteProject', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchDeleteProject(id, selectAuth(thunkApi.getState())))
)
