import { createReducer, createSelector } from '@reduxjs/toolkit'
import { ExcalidrawElement } from '../../../../packages/excalidraw/element/types'
import { LOCAL_STORAGE, removeFromLocalStorage, saveToLocalStorage } from '../../utils/persistence'
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
  setContinuousSceneUpdateIsPending,
  resetAPIError,
  loadSceneContinuos,
  loadUpdateSceneContinuos,
  setObjectivePlusStore,
  loadProject,
  loadScene,
  discardProject,
} from './actions'
import { selectAuth } from '../auth/reducer'
import { AppState, BinaryFileData } from '../../../../packages/excalidraw/types'
import { TRadixColor } from '../../../objective/UI/colors'
import { TResetAuth, resetAuth } from '../auth/actions'
import { orderBy } from '../../../objective/utils/helpers'
import { mergeArraysById } from '../helpers'

export interface IBase {
  id: string
  created_at: string
  updated_at: string | null
  updated_by: string | null
  is_deleted: boolean
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

export type OrderMode =
  | 'created'
  | 'created.desc'
  | 'updated'
  | 'updated.desc'
  | 'alphabetical'
  | 'alphabetical.desc'

export type APIError = {
  type: 'UserError' | 'ServerError' | 'InternalError' | 'ConnectionError' | 'UnknownError'
  message: string
  detail?: string
  status?: number
  renderOpts?: {
    noHide?: boolean
    color?: TRadixColor
  }
}
export interface IProjectsState {
  /** user's projects */
  projects: IProject[]
  toggledProjectId: IProject['id'] | undefined // TODO use URL Path param instead
  projectsMeta?: {
    order?: OrderMode
  }

  /** full scenes info for thumbnails render only (scene elements could be outdated) */
  scenes: ISceneFull[]
  scenesMeta?: {
    view?: 'list' | 'icons'
    order?: OrderMode
  }

  /** target scene to request full scene info and pass it to Excalidraw state */
  currentScene: ISceneSimplified | undefined

  error: APIError | undefined
  pendingRequest: boolean
  /** Pending initial loading */
  initialSceneLoadingIsPending: boolean
  continuousSceneUpdateIsPending: boolean
}

export const initialState: IProjectsState = {
  projects: [],
  toggledProjectId: undefined,
  scenes: [],
  currentScene: undefined,
  error: undefined,
  pendingRequest: false,
  initialSceneLoadingIsPending: true, // default true so when component is mounted for the fist time, it will render Loader immediately
  continuousSceneUpdateIsPending: false,
}

const reducer = createReducer(initialState, (builder) => {
  // -------------------- Regular Actions -----------------------------------------------
  builder.addCase(setObjectivePlusStore, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      ...action.payload,
    })
  )
  builder.addCase(toggleProject, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      toggledProjectId: action.payload,
    })
  )
  builder.addCase(discardProject, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: state.projects.filter((p) => p.id !== action.payload),
    })
  )

  // -------------------- Regular Actions - requests lifecycle ----------------------------

  builder.addCase(setInitialSceneLoadingIsPending, (state, action) => {
    state.initialSceneLoadingIsPending = action.payload
    return state
  })
  builder.addCase(setContinuousSceneUpdateIsPending, (state, action) => {
    state.continuousSceneUpdateIsPending = action.payload
    return state
  })
  builder.addCase(resetAPIError, (state, action) => {
    state.error = undefined
    return state
  })

  // -------------------- Thunk Actions -----------------------------------------------

  builder.addCase(loadProject.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: mergeArraysById(state.projects, [action.payload]).sort((a, b) =>
        orderBy(undefined, a, b)
      ),
    })
  )
  builder.addCase(loadProjects.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      projects: mergeArraysById(state.projects, action.payload).sort((a, b) =>
        orderBy(undefined, a, b)
      ),
    })
  )
  // Scenes REQUEST LIFECYCLE
  builder.addCase(loadScene.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      scenes: mergeArraysById(state.scenes, [action.payload]).sort((a, b) =>
        orderBy(undefined, a, b)
      ),
    })
  )
  builder.addCase(loadScenes.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.PROJECTS, {
      ...state,
      scenes: mergeArraysById(state.scenes, action.payload).sort((a, b) =>
        orderBy(undefined, a, b)
      ),
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
    (state, action) => {
      if (
        action.type === loadSceneContinuos.pending.type ||
        action.type === loadUpdateSceneContinuos.pending.type
      ) {
        // do not discard state.error for continues loading actions
        state.pendingRequest = true
      } else {
        state.error = undefined
        state.pendingRequest = true
      }
    }
  )
  builder.addMatcher<TRejectedAction>(
    (action): action is TRejectedAction =>
      action.type.startsWith('projects') && action.type.endsWith('/rejected'),
    (state, action) => {
      state.pendingRequest = false

      if (action.payload) state.error = action.payload
      else
        state.error = {
          type: 'InternalError',
          message: action.error.message || 'Internal app error',
        }

      // special options for continuous requests
      if (action.type === loadSceneContinuos.rejected.type) {
        state.error.renderOpts = { noHide: true, color: 'yellow' }
        state.error.detail = undefined
        state.error.message = 'No internet connection. Offline mode. '
        state.error.detail = undefined
      }
      if (action.type === loadUpdateSceneContinuos.rejected.type) {
        state.error.renderOpts = { noHide: true, color: 'yellow' }
        state.error.detail = undefined
        state.error.message = 'No internet connection. Offline mode. '
        state.error.detail = 'Save your scene locally to avoid losing any changes. '
      }
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

  // auth - on reset auth (dispatched by loadlogout thunk)
  builder.addMatcher(
    (action): action is TResetAuth => resetAuth.match(action),
    () => {
      removeFromLocalStorage(LOCAL_STORAGE.PROJECTS)
      return initialState
    }
  )
})

// TODO all selector should be with args or empty args () to avoid confusing

export const selectIsPending = (state: RootState) => state.projects.pendingRequest
export const selectContinuousSceneUpdateIsPending = (state: RootState) =>
  state.projects.continuousSceneUpdateIsPending

export const selectInitialSceneLoadingIsPending = (state: RootState) =>
  state.projects.initialSceneLoadingIsPending

export const selectError = (state: RootState) => state.projects.error
export const selectProjectsMeta = () => (state: RootState) => state.projects.projectsMeta
export const selectAllProjects = () => (state: RootState) => state.projects.projects
export const selectMyProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => !p.is_deleted && p.user_id === auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)
export const selectMyDeletedProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => p.is_deleted && p.user_id === auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)
export const selectOtherProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => !p.is_deleted && p.user_id !== auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)

export const selectProject = (projectId: string | undefined) => (state: RootState) =>
  state.projects.projects.find((p) => p.id === projectId)

export const selectScenesMeta = () => (state: RootState) => state.projects.scenesMeta

/** Select not deleted scenes of current toggled project */
export const selectScenes = (projectId: string | undefined) =>
  createSelector([selectProject(projectId), selectScenesMeta()], (project, meta) => {
    return (project?.scenes?.filter((s) => !s.is_deleted) || []).sort((a, b) =>
      orderBy(meta?.order, a, b)
    )
  })

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

export const selectAPIErrors = createSelector(
  [(state: RootState) => state.projects.error, (state: RootState) => state.auth.error],
  (project_error, auth_error) => [project_error, auth_error].filter((e): e is APIError => !!e)
)

export const selectNotUserAPIErrors = createSelector([selectAPIErrors], (errors) =>
  errors.filter((e) => e.type !== 'UserError')
)
export const selectUserAPIErrors = createSelector([selectAPIErrors], (errors) =>
  errors.filter((e) => e.type === 'UserError')
)

export default reducer
