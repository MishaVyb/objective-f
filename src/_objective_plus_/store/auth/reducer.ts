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

  // ON LOGOUT
  // do nothing with local storage (whatever success or reject)

  // ON RESET AUTH (dispatched by loadLogout thunk)
  builder.addMatcher(
    (action): action is TResetAuth => resetAuth.match(action),
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
