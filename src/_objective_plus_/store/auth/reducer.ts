import { createReducer } from '@reduxjs/toolkit'

import { LOCAL_STORAGE, removeFromLocalStorage, saveToLocalStorage } from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetAuth,
  TResetRequestStatusAction,
  resetAuth,
  resetRequestStatusAction,
} from './actions'

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
  /** auth id */
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
  user: IUser
  error: string | undefined
  pendingRequest: boolean
}

export const initialState: IAuthState = {
  user: { email: '', username: '', role: undefined },
  access_token: '',
  token_type: 'Bearer',
  error: undefined,
  pendingRequest: false,
}

const reducer = createReducer(initialState, (builder) => {
  // COMMON REQUEST LIFECYCLE
  builder.addMatcher<TPendingAction>(
    (action): action is TPendingAction =>
      action.type.startsWith('auth') && action.type.endsWith('/pending'),
    (state) => {
      state.pendingRequest = true
    }
  )
  builder.addMatcher<TRejectedAction>(
    (action): action is TRejectedAction =>
      action.type.startsWith('auth') && action.type.endsWith('/rejected'),
    (state, action) => {
      state.pendingRequest = false

      if (action.payload) state.error = action.payload
      else state.error = action.error.message
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
  // any success
  builder.addMatcher<TFulfilledAction>(
    (action): action is TFulfilledAction =>
      action.type.startsWith('auth') &&
      action.type.endsWith('/fulfilled') &&
      action.type.startsWith('auth/'),
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
    () => {
      removeFromLocalStorage(LOCAL_STORAGE.AUTH)
      return initialState
    }
  )
})

export const selectAuthIsPending = (state: RootState) => state.auth.pendingRequest
export const selectAuthError = (state: RootState) => state.auth.error

export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => !!state.auth.access_token
export const selectAccessToken = (state: RootState) => state.auth.access_token

export default reducer
