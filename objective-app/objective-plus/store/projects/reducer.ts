import { createReducer } from '@reduxjs/toolkit'
import { ExcalidrawElement } from '../../../../packages/excalidraw/element/types'

import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetRequestStatusAction,
  setInitialSceneLoadingIsPending,
  loadProjects,
  loadSceneInitial,
  resetRequestStatusAction,
  loadScenes,
  setContinuousSceneUpdateIsPending,
  resetAPIError,
  loadSceneContinuos,
  loadUpdateSceneContinuos,
  setObjectivePlusStore,
  loadProject,
  loadScene,
  discardProject,
  loadScenesFromLocalOrServer,
  renderSceneAction,
} from './actions'
import { AppState, BinaryFileData } from '../../../../packages/excalidraw/types'
import { TRadixColor } from '../../../objective/UI/colors'
import { orderBy } from '../../../objective/utils/helpers'
import { mergeArraysById } from '../helpers'
import { TSceneRenderVal } from '../../utils/objective-local-db'

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
  /** my and other projects with nested simple scene info */
  projects?: IProject[]
  projectsMeta?: {
    order?: OrderMode
  }

  /** full scenes info for thumbnails render only (scene elements could be outdated) */
  scenes?: ISceneFull[]
  scenesMeta?: {
    view?: 'list' | 'icons'
    order?: OrderMode
  }
  sceneRenders?: TSceneRenderVal[]

  /** target scene to request full scene info and pass it to Excalidraw state */
  currentScene?: ISceneSimplified

  error?: APIError
  pendingRequest?: boolean
  /** Pending initial loading of currentScene */
  initialSceneLoadingIsPending: boolean
  continuousSceneUpdateIsPending?: boolean
}
export const PROJECTS_PERSISTENCE_FIELDS: (keyof IProjectsState)[] = [
  'projects',
  'projectsMeta',
  'scenesMeta',
]

export const initialState: IProjectsState = {
  // NOTE
  // default true so when component is mounted for the fist time,
  // it will render Loader immediately
  initialSceneLoadingIsPending: true,
}

const reducer = createReducer(initialState, (builder) => {
  // -------------------- Regular Actions -----------------------------------------------
  builder.addCase(setObjectivePlusStore, (state, action) => ({
    ...state,
    ...action.payload,
  }))
  builder.addCase(discardProject, (state, action) => ({
    ...state,
    projects: state.projects?.filter((p) => p.id !== action.payload),
  }))

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

  builder.addCase(loadProject.fulfilled, (state, action) => ({
    ...state,
    projects: mergeArraysById(state.projects, [action.payload]).sort((a, b) =>
      orderBy(undefined, a, b)
    ),
  }))
  builder.addCase(loadProjects.fulfilled, (state, action) => ({
    ...state,
    projects: mergeArraysById(state.projects, action.payload).sort((a, b) =>
      orderBy(undefined, a, b)
    ),
  }))
  // Scenes REQUEST LIFECYCLE
  builder.addCase(loadScene.fulfilled, (state, action) => ({
    ...state,
    scenes: mergeArraysById(state.scenes, [action.payload]).sort((a, b) =>
      orderBy(undefined, a, b)
    ),
  }))
  builder.addCase(loadScenes.fulfilled, (state, action) => ({
    ...state,
    scenes: mergeArraysById(state.scenes, action.payload).sort((a, b) => orderBy(undefined, a, b)),
  }))
  builder.addCase(loadScenesFromLocalOrServer.fulfilled, (state, action) => ({
    ...state,
    scenes: mergeArraysById(state.scenes, action.payload).sort((a, b) => orderBy(undefined, a, b)),
  }))
  builder.addCase(renderSceneAction.fulfilled, (state, action) => ({
    ...state,
    sceneRenders: mergeArraysById(state.sceneRenders, [action.payload]).sort((a, b) =>
      orderBy(undefined, a, b)
    ),
  }))

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
      else {
        console.error(action.error)
        state.error = {
          type: 'InternalError',
          message: action.error.message || 'Internal app error',
        }
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
})

export default reducer
