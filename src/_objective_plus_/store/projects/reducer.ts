import { createReducer } from '@reduxjs/toolkit'
import { LOCAL_STORAGE, saveToLocalStorage } from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetRequestStatusAction,
  loadProjects,
  resetRequestStatusAction,
} from './actions'

export interface IBase {
  id: string
  created_at: string
  updated_at: string
  updated_by: string
  is_deleted: string
  user_id: string
}

export interface ISceneSimplified extends IBase {
  name: string
}

export interface ISceneFull extends ISceneSimplified {
  type: string
  version: number
  source: string
  elements: string // JSON
  appState: string // JSON
}

export interface IProject extends IBase {
  name: string
  scenes: readonly ISceneSimplified[]
}
export interface IProjectsState {
  /** user's projects */
  projects: readonly IProject[]
  selectedProject: IProject['id'] | undefined
  error: string | undefined
  pendingRequest: boolean
}

export const initialState: IProjectsState = {
  projects: [],
  selectedProject: undefined,
  error: undefined,
  pendingRequest: false,
}

const reducer = createReducer(initialState, (builder) => {
  // NOTE:
  // Common request lifecycle actions handlers descirbed at auth reducer

  builder.addCase(loadProjects.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: action.payload,
    })
  )
})

export const selectProjectsIsPending = (state: RootState) => state.auth.pendingRequest
export const selectProjectsError = (state: RootState) => state.auth.error

export const selectProjects = (state: RootState) => state.projects.projects

export default reducer
