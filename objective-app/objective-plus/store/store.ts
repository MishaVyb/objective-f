import { configureStore } from '@reduxjs/toolkit'

import { LOCAL_STORAGE, loadFromLocalStorage } from '../utils/persistence'
import authReducer, { initialState as AuthInitialState } from './auth/reducer'
import projectsReducer, { initialState as ProjectsInitialState } from './projects/reducer'

const preloadedState = {
  auth: {
    ...AuthInitialState,
    ...loadFromLocalStorage(
      LOCAL_STORAGE.AUTH,
      ['user', 'access_token', 'token_type'],
      AuthInitialState
    ),
  },

  projects: {
    ...ProjectsInitialState,
    ...loadFromLocalStorage(
      LOCAL_STORAGE.PROJECTS,
      ['currentScene', 'projects', 'projectsMeta', 'toggledProjectId', 'scenes', 'scenesMeta'],
      ProjectsInitialState
    ),
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
