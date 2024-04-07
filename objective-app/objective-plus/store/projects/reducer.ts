import { createReducer, createSelector } from '@reduxjs/toolkit'
import { ExcalidrawElement } from '../../../../packages/excalidraw/element/types'
import { LOCAL_STORAGE, saveToLocalStorage } from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetRequestStatusAction,
  setInitialSceneLoadingIsPending,
  loadProjects,
  loadSceneInitial,
  resetRequestStatusAction,
  toggleProject,
  loadScenes,
} from './actions'
import { selectAuth } from '../auth/reducer'
import { AppState, BinaryFileData } from '../../../../packages/excalidraw/types'

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
  appState: Partial<AppState> // JSON

  /** Excalidraw file IDs currently stored at backend */
  files: Pick<BinaryFileData, 'id' | 'mimeType'>[]
}

export interface IProject extends IBase {
  name: string
  scenes: readonly ISceneSimplified[]
}
export interface IProjectsState {
  /** user's projects */
  projects: IProject[]
  toggledProjectId: IProject['id'] | undefined // use URL Path param instead

  /** full scenes info for thumbnails render only (scene elements could be outdated) */
  scenes: ISceneFull[]

  /** target scene to request full scene info and pass it to Excalidraw state */
  currentScene: ISceneSimplified | undefined

  error: string | undefined
  pendingRequest: boolean
  /** Pending initial loading */
  initialSceneLoadingIsPending: boolean
}

export const initialState: IProjectsState = {
  projects: [],
  toggledProjectId: undefined,
  scenes: [],
  currentScene: undefined,
  error: undefined,
  pendingRequest: false,
  initialSceneLoadingIsPending: true, // default true so when component is mounted for the fist time, it will render Loader immediately
}

const reducer = createReducer(initialState, (builder) => {
  // -------------------- Regular Actions -----------------------------------------------
  builder.addCase(toggleProject, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      toggledProjectId: action.payload,
    })
  )

  builder.addCase(setInitialSceneLoadingIsPending, (state, action) => {
    state.initialSceneLoadingIsPending = action.payload
    return state
  })

  // -------------------- Thunk Actions -----------------------------------------------

  builder.addCase(loadProjects.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: action.payload,
    })
  )

  // Scenes REQUEST LIFECYCLE

  builder.addCase(loadScenes.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      scenes: action.payload,
    })
  )

  // DO NOT CHANGE state.initialSceneLoadingIsPending here, we do it in separate action above
  // and we call that action in proper time scene would be fully initialized
  builder.addCase(loadSceneInitial.pending, (state, action) => {
    state.currentScene = undefined
    return state
  })
  builder.addCase(loadSceneInitial.rejected, (state, action) => {
    state.currentScene = undefined
    return state
  })
  builder.addCase(loadSceneInitial.fulfilled, (state, action) => {
    state.currentScene = action.payload
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

export const selectInitialSceneLoadingIsPending = (state: RootState) =>
  state.projects.initialSceneLoadingIsPending

export const selectError = (state: RootState) => state.projects.error

export const selectProjects = createSelector(
  (state: RootState) => state.projects,
  (projects) => projects.projects.filter((p) => !p.is_deleted)
)

export const selectToggledProjectId = (state: RootState) =>
  state.projects.toggledProjectId || state.projects.projects[0]?.id

export const selectToggledProject = (state: RootState) =>
  state.projects.projects.find((p) => p.id === state.projects.toggledProjectId) ||
  state.projects.projects[0]

/** Select not deleted scenes of current toggled project */
export const selectScenes = createSelector(
  [selectToggledProject],
  (project) => project?.scenes?.filter((s) => !s.is_deleted) || []
)

export const selectSceneFullInfo = (id: ISceneFull['id']) => (state: RootState) =>
  state.projects.scenes.find((s) => s.id === id)

/**
 * Get current openned Scene meta info.
 *
 * For full scene elements or appState access, use Excalidraw API. Like:
 *  `appState = useExcalidrawAppState`
 *
 * (as we do not store in redux state, only at Excalidraw State)
 */
export const selectCurrentScene = (state: RootState) => state.projects.currentScene

export const selectIsMyScene = createSelector(
  [selectCurrentScene, selectAuth],
  (scene, auth) => scene?.user_id === auth.user.id
)
export const selectIsOtherScene = createSelector(
  [selectCurrentScene, selectAuth],
  (scene, auth) => scene?.user_id !== auth.user.id
)

export default reducer
