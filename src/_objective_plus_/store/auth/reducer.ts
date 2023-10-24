import { createReducer } from '@reduxjs/toolkit'

import {
  AUTH_LOCAL_STORAGE_KEY,
  removeFromLocalStorage,
  saveToLocalStorage,
} from '../../utils/persistence'
import { RootState } from '../store'
import {
  TFulfilledAction,
  TPendingAction,
  TRejectedAction,
  TResetRequestStatusAction,
  loadLogout,
  resetRequestStatusAction,
} from './actions'

export interface ITokens {
  /** no 'Bearer' prefix */
  access_token: string
  token_type: 'bearer'
}

export interface IUser {
  /** auth id */
  email: string

  /** not required, not unique (any string, not a slug) */
  username?: string | undefined
  role?: string | undefined
}

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

const initialState: IAuthState = {
  user: { email: '' },
  access_token: '',
  token_type: 'bearer',
  error: undefined,
  pendingRequest: false,
}

const reducer = createReducer(initialState, (builder) => {
  // ANY PENDING:
  builder.addMatcher<TPendingAction>(
    (action): action is TPendingAction => action.type.endsWith('/pending'),
    (state) => {
      state.pendingRequest = true
    }
  )

  // ANY REJECT
  builder.addMatcher<TRejectedAction>(
    (action): action is TRejectedAction => action.type.endsWith('/rejected'),
    (state, action) => {
      state.pendingRequest = false

      if (action.payload) state.error = action.payload
      else state.error = action.error.message
    }
  )

  // ANY SUCCESS + resetRequestStatusAction
  builder.addMatcher<TFulfilledAction | TResetRequestStatusAction>(
    (action): action is TFulfilledAction | TResetRequestStatusAction =>
      action.type.endsWith('/fulfilled') || resetRequestStatusAction.match(action),
    (state) => {
      state.pendingRequest = false
      state.error = undefined
    }
  )

  // ANY SUCCESS
  builder.addMatcher<TFulfilledAction>(
    (action): action is TFulfilledAction => action.type.endsWith('/fulfilled'),
    (state, action) => {
      if (action.payload) {
        return saveToLocalStorage(AUTH_LOCAL_STORAGE_KEY, { ...state, ...action.payload })
      }
    }
  )

  // ONLY ON LOGOUT (whatever success or reject)
  builder.addMatcher(
    (action) => loadLogout.fulfilled.match(action) || loadLogout.rejected.match(action),
    () => {
      removeFromLocalStorage(AUTH_LOCAL_STORAGE_KEY)
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
