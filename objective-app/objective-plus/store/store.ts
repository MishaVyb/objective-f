import { configureStore } from '@reduxjs/toolkit'

import { LOCAL_STORAGE, loadFromLocalStorage } from '../utils/persistence'
import authReducer, { initialState as AuthInitialState } from './auth/reducer'
import projectsReducer, { initialState as ProjectsInitialState } from './projects/reducer'

const preloadedState = {
  auth: {
    ...loadFromLocalStorage(LOCAL_STORAGE.AUTH, AuthInitialState),

    // always takes default (not from local storage)
    error: AuthInitialState.error,
    pendingRequest: AuthInitialState.pendingRequest,
  },

  // FIXME
  // in case some fields are not local storage, we should merge load result with InitialState,
  // so do not fall on underfined values where array is expected, etc.
  projects: {
    ...loadFromLocalStorage(LOCAL_STORAGE.PROJECTS, ProjectsInitialState),

    // always takes default (not from local storage)
    error: ProjectsInitialState.error,
    pendingRequest: ProjectsInitialState.pendingRequest,
    initialSceneLoadingIsPending: ProjectsInitialState.initialSceneLoadingIsPending,
  },
}

//@ts-ignore
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
  },
  preloadedState: preloadedState,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
