import { createReducer, createSelector } from '@reduxjs/toolkit'
import { ExcalidrawElement } from '../../../element/types'
import { AppState } from '../../../types'
import { LOCAL_STORAGE, saveToLocalStorage } from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetRequestStatusAction,
  loadProjects,
  loadScene,
  resetRequestStatusAction,
  toggleProject,
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
  project_id: string
  name: string
}

export interface ISceneFull extends ISceneSimplified {
  type: string
  version: number
  source: string
  elements: readonly ExcalidrawElement[] // JSON
  appState: AppState // JSON
}

export interface IProject extends IBase {
  name: string
  scenes: readonly ISceneSimplified[]
}
export interface IProjectsState {
  /** user's projects */
  projects: IProject[]
  toggledProjectId: IProject['id'] | undefined // use URL Path param instead
  scenes: ISceneFull[]

  error: string | undefined
  pendingRequest: boolean
  /** Pending initial loading */
  pendingLoadingScene: boolean
}

export const initialState: IProjectsState = {
  projects: [],
  toggledProjectId: undefined,
  scenes: [],
  error: undefined,
  pendingRequest: false,
  pendingLoadingScene: false,
}

const reducer = createReducer(initialState, (builder) => {
  // -------------------- Regular Actions -----------------------------------------------
  builder.addCase(toggleProject, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      toggledProjectId: action.payload,
    })
  )

  // -------------------- Thunk Actions -----------------------------------------------

  builder.addCase(loadProjects.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: action.payload,
    })
  )

  // Scenes REQUEST LIFECYCLE
  builder.addCase(loadScene.pending, (state, action) => {
    state.pendingLoadingScene = true
    return state
  })
  builder.addCase(loadScene.rejected, (state, action) => {
    state.pendingLoadingScene = false
    return state
  })
  builder.addCase(loadScene.fulfilled, (state, action) => {
    state.pendingLoadingScene = false
    return state
  })

  // COMMON REQUEST LIFECYCLE
  builder.addMatcher<TPendingAction>(
    (action): action is TPendingAction =>
      action.type.startsWith('projects') && action.type.endsWith('/pending'),
    (state) => {
      state.pendingRequest = true
    }
  )
  builder.addMatcher<TRejectedAction>(
    (action): action is TRejectedAction =>
      action.type.startsWith('projects') && action.type.endsWith('/rejected'),
    (state, action) => {
      state.pendingRequest = false

      if (action.payload) state.error = action.payload
      else state.error = action.error.message
    }
  )
  builder.addMatcher<TFulfilledAction | TResetRequestStatusAction>(
    (action): action is TFulfilledAction | TResetRequestStatusAction =>
      (action.type.startsWith('projects') && action.type.endsWith('/fulfilled')) ||
      resetRequestStatusAction.match(action),
    (state) => {
      state.pendingRequest = false
      state.error = undefined
    }
  )

  // FIXME
  // For now, we do not implement special logic on element create\delete\update by finding
  // this element in projects array and make manupulation with target element (add/update/delete)
  // We simple dispatch `loadProjects` again after any action.

  // NOTE
  // We do not handle any logic of saving Scenes to Redux Store / Local Browser Storage.
  // Just load it from backend and pas to Excalidraw directly.
})

export const selectIsPending = (state: RootState) => state.projects.pendingRequest
export const selectLoadingSceneIsPending = (state: RootState) => state.projects.pendingLoadingScene
export const selectError = (state: RootState) => state.projects.error

export const selectProjects = createSelector(
  (state: RootState) => state.projects,
  (projects) => projects.projects.filter((p) => !p.is_deleted)
)

export const selectToggledProjectId = (state: RootState) => state.projects.toggledProjectId
export const selectToggledProject = (state: RootState) =>
  state.projects.projects.find((p) => p.id === state.projects.toggledProjectId)

/** Select not deleted scenes of current toggled project */
export const selectScenes = createSelector(
  [selectToggledProject],
  (project) => project?.scenes.filter((s) => !s.is_deleted) || []
)

/** @deprecated
 * use appState = useExcalidrawAppState instead as we do not store in redux state,
 * only at Excalidraw State
 */
export const selectSceneFull = (id: ISceneFull['id']) => (state: RootState) =>
  state.projects.scenes.find((s) => s.id === id)

export default reducer
