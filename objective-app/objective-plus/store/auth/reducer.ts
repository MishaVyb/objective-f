import { createReducer } from '@reduxjs/toolkit'

import { LOCAL_STORAGE, removeFromLocalStorage, saveToLocalStorage } from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetAuth,
  TResetRequestStatusAction,
  loadUser,
  resetAuth,
  resetRequestStatusAction,
} from './actions'
import { APIError } from '../projects/reducer'
import { mergeArraysById } from '../helpers'

export interface ITokens {
  /** no 'Bearer' prefix */
  access_token: string
  token_type: 'Bearer'
}

export enum UserRoles {
  CINEMATOGRAPHY = 'Cinematography',
  PRODUCER = 'Producer',
  DIRECTOR = 'Director',
  DIRECTOR_ASSISTANT = 'Director Assistant',
  DOP = 'Director of Photography',
  CAMERA_ASSISTANT = 'Camera Assistant',
  GAFFER = 'Gaffer',
  ART_DIRECTOR = 'Art Director',
  SET_DESIGNER = 'Set Designer',
  PROP_DESIGNER = 'Prop Designer',
  OTHER = 'Other',
}

export interface IUser {
  /**  uuid */
  id: string
  /** unique login field for authentication*/
  email: string

  /** not required, not unique (any string, not a slug) */
  username?: string
  role?: UserRoles
}

/** Only User (for loadUser & updateUser) */
export interface IAuthSimplified {
  user: IUser
}
export interface IAuthFull extends ITokens, IAuthSimplified {}

export interface RequestFailReason {
  json: Record<string, any>
}

export interface IAuthState extends ITokens {
  /** me */
  user: IUser

  /** other users */
  users: IUser[]

  error: APIError | undefined
  pendingRequest: boolean
}

export const initialState: IAuthState = {
  user: { id: '', email: '', username: '', role: undefined },
  users: [],
  access_token: '',
  token_type: 'Bearer',
  error: undefined,
  pendingRequest: false,
}

const reducer = createReducer(initialState, (builder) => {
  builder.addCase(loadUser.fulfilled, (state, action) =>
    saveToLocalStorage(LOCAL_STORAGE.AUTH, {
      ...state,
      users: mergeArraysById(state.users, [action.payload]),
    })
  )

  // COMMON REQUEST LIFECYCLE
  builder.addMatcher<TPendingAction>(
    (action): action is TPendingAction =>
      action.type.startsWith('auth') && action.type.endsWith('/pending'),
    (state) => {
      state.error = undefined
      state.pendingRequest = true
    }
  )
  builder.addMatcher<TRejectedAction>(
    (action): action is TRejectedAction =>
      action.type.startsWith('auth') && action.type.endsWith('/rejected'),
    (state, action) => {
      state.pendingRequest = false

      if (action.payload) state.error = action.payload
      else
        state.error = {
          type: 'InternalError',
          message: action.error.message || 'Internal app error',
        }
    }
  )
  builder.addMatcher<TFulfilledAction | TResetRequestStatusAction>(
    (action): action is TFulfilledAction | TResetRequestStatusAction =>
      (action.type.startsWith('auth') && action.type.endsWith('/fulfilled')) ||
      resetRequestStatusAction.match(action),
    (state) => {
      state.pendingRequest = false
      state.error = undefined
    }
  )

  // AUTH:
  // any success // FIXME separate reducer's functions
  builder.addMatcher<TFulfilledAction>(
    (action): action is TFulfilledAction =>
      action.type.startsWith('auth') &&
      action.type.endsWith('/fulfilled') &&
      !action.type.endsWith('/loadUserMe'), //  except getUser
    (state, action) => {
      if (action.payload) {
        return saveToLocalStorage(LOCAL_STORAGE.AUTH, { ...state, ...action.payload })
      }
    }
  )

  // auth - on logout
  // do nothing with local storage (whatever success or reject)

  // auth - on reset auth (dispatched by loadlogout thunk)
  builder.addMatcher(
    (action): action is TResetAuth => resetAuth.match(action),
    (store) => {
      const logoutState = { ...initialState, user: store.user } // leave user info, but remove token
      saveToLocalStorage(LOCAL_STORAGE.AUTH, logoutState)
      return logoutState
    }
  )
})

export const selectAuthIsPending = (state: RootState) => state.auth.pendingRequest
export const selectAuthUserAPIErrors = (state: RootState) =>
  state.auth.error?.type === 'UserError' ? state.auth.error.message : undefined

export const selectAuth = (state: RootState) => state.auth
export const selectUserMe = (state: RootState) => state.auth.user
/** get user Me or from Others */
export const selectUser = (id: IUser['id'] | undefined) => (state: RootState) =>
  state.auth.user.id === id ? state.auth.user : state.auth.users.find((v) => v.id === id)
export const selectIsAuthenticated = (state: RootState) => !!state.auth.access_token
export const selectAccessToken = (state: RootState) => state.auth.access_token

export default reducer
