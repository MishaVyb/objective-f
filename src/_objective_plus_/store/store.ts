import { configureStore } from '@reduxjs/toolkit'

import { LOCAL_STORAGE, loadFromLocalStorage } from '../utils/persistence'
import authReducer, { IAuthState } from './auth/reducer'
import projectsReducer, { IProjectsState } from './projects/reducer'

const preloadedState = {
  auth: loadFromLocalStorage<IAuthState>(LOCAL_STORAGE.AUTH),
  projects: loadFromLocalStorage<IProjectsState>(LOCAL_STORAGE.PROJECTS)
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
  },
  preloadedState: preloadedState,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
