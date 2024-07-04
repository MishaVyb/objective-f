import { configureStore } from '@reduxjs/toolkit'

import authReducer, {
  AUTH_PERSISTENCE_FIELDS,
  initialState as AuthInitialState,
  IAuthState,
} from './auth/reducer'
import projectsReducer, {
  IProjectsState,
  PROJECTS_PERSISTENCE_FIELDS,
  initialState as ProjectsInitialState,
} from './projects/reducer'
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistStore,
  persistReducer,
  createTransform,
  PersistConfig,
  WebStorage,
  PersistState,
} from 'redux-persist'
import localStorage from 'redux-persist/lib/storage'
import hardSet from 'redux-persist/lib/stateReconciler/hardSet'

enum LOCAL_STORAGE_KEYS {
  AUTH = 'objective-beta:auth',
  PROJECTS = 'objective-beta:projects',
}

/**
 * validate & dump JSON data
 * perform JSON parse/stringify
 *
 * NOTE: default impl stringify each value and then stringify the whole object,
 *       therefore it becomes stringified double times
 *       it works, but inconvenient for debugging at dev tools, etc
 *
 * WARNING: could be used only with with serialize/deserialize 'false' at config
 * */
const ExtendedLocalStorage: WebStorage = {
  setItem: async (key, item) => {
    const serialized = JSON.stringify(item)
    return await localStorage.setItem(key, serialized)
  },
  getItem: async (key) => {
    const raw = await localStorage.getItem(key)
    const parsed = raw && JSON.parse(raw)
    return parsed
  },
  removeItem: async (key) => {
    return await localStorage.removeItem(key)
  },
}

/**
 * transform data from validation & prepare data for dump per key/reducer
 * does not perform JSON parse/stringify
 * */
const ExtendedTransform = createTransform(
  (inboundState, key) => inboundState,
  (outboundState, key) => outboundState,
  { whitelist: [] }
)

type ExtendedPersistConfig<S> = PersistConfig<S> & { deserialize?: boolean }

const authPersistConfig = {
  key: LOCAL_STORAGE_KEYS.AUTH,
  stateReconciler: hardSet,
  whitelist: AUTH_PERSISTENCE_FIELDS,
  keyPrefix: '',
  storage: ExtendedLocalStorage,
  serialize: false,
  deserialize: false,
}
const projectsPersistConfig: ExtendedPersistConfig<IProjectsState> = {
  key: LOCAL_STORAGE_KEYS.PROJECTS,
  stateReconciler: hardSet,
  whitelist: PROJECTS_PERSISTENCE_FIELDS,
  keyPrefix: '',
  storage: ExtendedLocalStorage,
  serialize: false,
  deserialize: false,
}

const _persist: PersistState = undefined! // HACK ts support

const preloadedState = {
  auth: { ...AuthInitialState, _persist },
  projects: { ...ProjectsInitialState, _persist },
}

//@ts-ignore
export const store = configureStore({
  reducer: {
    auth: persistReducer<IAuthState>(authPersistConfig, authReducer),
    projects: persistReducer<IProjectsState>(projectsPersistConfig, projectsReducer),
  },
  preloadedState: preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // NOTE:
        // https://redux-toolkit.js.org/usage/usage-guide#use-with-redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const localStoragePersistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
