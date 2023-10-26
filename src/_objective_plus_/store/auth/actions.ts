import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'

import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk'
import { fetchLogin, fetchLogout, fetchUpdateUser, fetchUser } from '../../utils/objective-api'
import { RootState } from '../store'
import { IAuthSimplified, ITokens, UserRoles, selectAuth } from './reducer'

/** email & password */
export type IMakeLoginPayload = FormData

/** create user */
export interface IUserCreatePayload {
  email: string
  password: string
  role?: UserRoles
  username?: string
}

export type IUserUpdatePayload = Partial<IUserCreatePayload>

interface ThunkApiConfig {
  rejectValue: string
  state: RootState
}

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

/*
Helper to make fetch request inside AsyncThunk's payloadCreator safely.
  - Await for callback.
  - Catch any error and return `thunkApi.rejectWithValue` in case.
*/
export const safeAsyncThunk = async <TResponse>(
  thunkApi: GetThunkAPI<ThunkApiConfig>,
  callback: () => Promise<TResponse>
) => {
  try {
    return await callback()
  } catch (e) {
    let response_data

    if (e instanceof Response) {
      const response = e

      // Parse Response data safely
      try {
        response_data = await response.json()
      } catch {
        response_data = await response.text()
      }

      // Dispath known errors:
      if (response.status === 400 && response_data.detail === 'LOGIN_BAD_CREDENTIALS')
        return thunkApi.rejectWithValue(
          'Invalid credentials. User does not exist or password incorrect. '
        )
      if (response.status === 400 && response_data.detail === 'UPDATE_USER_EMAIL_ALREADY_EXISTS')
        return thunkApi.rejectWithValue('User with that email already exist. ')
      if (response.status === 401) {
        thunkApi.dispatch(resetAuth())
        return thunkApi.rejectWithValue('Unauthorized. Please, sign in. ')
      }
    }

    // Error not a Response or Unknown response error:
    console.error('Unknown error in request: ', response_data || e)
    return thunkApi.rejectWithValue('Something went wrong. Please, try again. ')
  }
}

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

export const updateUser = createAsyncThunk<IAuthSimplified, IUserUpdatePayload, ThunkApiConfig>(
  'auth/updateUser',
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
