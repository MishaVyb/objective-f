import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'

import {
  fetchLogin,
  fetchLogout,
  fetchRegister,
  fetchUpdateUser,
  fetchUser,
} from '../../utils/objective-api'
import { ThunkApiConfig, safeAsyncThunk } from '../helpers'
import { IAuthSimplified, ITokens, UserRoles, selectAuth } from './reducer'

/** login */
export interface IMakeLoginPayload {
  email: string
  password: string
}

/** create user */
export interface IUserCreatePayload extends IMakeLoginPayload {
  role?: UserRoles
  username?: string
}

export type IUserUpdatePayload = Partial<IUserCreatePayload>

export type TAuthAsyncThunk = AsyncThunk<
  //
  // Returned: request Response
  | IAuthSimplified // loadUser & updateUser
  | ITokens // loadLogin
  | void, // loadLogout
  //
  // ThunkArg: request Payload
  | IMakeLoginPayload // login
  | IUserCreatePayload // signup
  | IUserUpdatePayload, // update
  //
  // Config types:
  ThunkApiConfig
>

export type TPendingAction = ReturnType<TAuthAsyncThunk['pending']>
export type TRejectedAction = ReturnType<TAuthAsyncThunk['rejected']>
export type TFulfilledAction = ReturnType<TAuthAsyncThunk['fulfilled']>

export const resetRequestStatusAction = createAction('auth/resetRequestStatusAction')
export type TResetRequestStatusAction = ReturnType<typeof resetRequestStatusAction>

export const resetAuth = createAction('auth/resetAuth')
export type TResetAuth = ReturnType<typeof resetAuth>

export const loadLogin = createAsyncThunk<ITokens, IMakeLoginPayload, ThunkApiConfig>(
  'auth/loadLogin',
  (payload, thunkApi) => safeAsyncThunk(thunkApi, () => fetchLogin(payload))
)

export const loadUser = createAsyncThunk<IAuthSimplified, void, ThunkApiConfig>(
  'auth/loadUser',
  (_, thunkApi) =>
    safeAsyncThunk(thunkApi, async () => ({
      //
      // HACK: `user` is a nested key inside `auth` store
      user: await fetchUser(selectAuth(thunkApi.getState())),
    }))
)

export const loadRegister = createAsyncThunk<IAuthSimplified, IUserCreatePayload, ThunkApiConfig>(
  'auth/loadRegister',
  (payload, thunkApi) =>
    safeAsyncThunk(thunkApi, async () => ({
      //
      // HACK: `user` is a nested key inside `auth` store
      user: await fetchRegister(payload),
    }))
)

export const loadUpdateUser = createAsyncThunk<IAuthSimplified, IUserUpdatePayload, ThunkApiConfig>(
  'auth/loadUpdateUser',
  (payload, thunkApi) =>
    safeAsyncThunk(thunkApi, async () => ({
      //
      // HACK: `user` is a nested key inside `auth` store
      user: await fetchUpdateUser(payload, selectAuth(thunkApi.getState())),
    }))
)

export const loadLogout = createAsyncThunk<void, void, ThunkApiConfig>(
  'auth/loadLogout',
  async (_, thunkApi) => {
    thunkApi.dispatch(resetAuth())
    await safeAsyncThunk(thunkApi, () => fetchLogout(selectAuth(thunkApi.getState())))
    // void (no return)
  }
)
