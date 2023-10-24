import { configureStore } from '@reduxjs/toolkit'

import { AUTH_LOCAL_STORAGE_KEY, loadFromLocalStorage } from '../utils/persistence'
import authReducer, { IAuthState } from './auth/reducer'



const preloadedState = {
  auth: loadFromLocalStorage<IAuthState>(AUTH_LOCAL_STORAGE_KEY),
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: preloadedState,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
