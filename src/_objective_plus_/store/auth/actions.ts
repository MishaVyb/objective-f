import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'

import {
  fetchLogin,
  fetchLogout,
  fetchUpdateUser,
  fetchUser
} from '../../utils/objective-api'
import { RootState } from '../store'
import { IAuthFull, IAuthSimplified, ITokens, selectAuth } from './reducer'

/** email & password */
export type IMakeLoginPayload = FormData

/** update user */
export interface IUserPayload {
  email: string
  password: string
  role?: string
  username?: string
}

interface ThunkApiConfig {
  rejectValue: string
  state: RootState
}

export type TAuthAsyncThunk = AsyncThunk<
  IAuthSimplified | IAuthFull | void,
  IMakeLoginPayload | IUserPayload ,
  ThunkApiConfig
>

export type TPendingAction = ReturnType<TAuthAsyncThunk['pending']>
export type TRejectedAction = ReturnType<TAuthAsyncThunk['rejected']>
export type TFulfilledAction = ReturnType<TAuthAsyncThunk['fulfilled']>

export const resetRequestStatusAction = createAction('auth/resetRequestStatusAction')
export type TResetRequestStatusAction = ReturnType<typeof resetRequestStatusAction>

export const loadLogin = createAsyncThunk<ITokens, IMakeLoginPayload, ThunkApiConfig>(
  'auth/loadLogin',
  async (payload, thunkApi) => {
    try {
      return await fetchLogin(payload)
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e)
      return thunkApi.rejectWithValue(message)
    }
  }
)

export const loadUser = createAsyncThunk<IAuthSimplified, void, ThunkApiConfig>(
  'auth/loadUser',
  async (_, thunkApi) => {
    try {
      const res = await fetchUser(selectAuth(thunkApi.getState()))
      return { user: res }
    } catch (e) {
      if (e instanceof Response) {
        const response = e
        if (response.status === 401) {
          // Unathosorized

          thunkApi.dispatch(loadLogout())
          return thunkApi.rejectWithValue('Unauthorized. Please, sign in. ')
        }
      }
      console.log('Unhandled error in request: ', e)
      return thunkApi.rejectWithValue(JSON.stringify(e))
    }
  }
)

export const updateUser = createAsyncThunk<IAuthSimplified, IUserPayload, ThunkApiConfig>(
  'auth/updateUser',
  async (payload, thunkApi) => {
    try {
      const res = await fetchUpdateUser(payload, selectAuth(thunkApi.getState()))
      return { user: res }
    } catch (e) {
      if (e instanceof Response) {
        const response = e
        if (response.status === 401) {
          // Unathosorized

          thunkApi.dispatch(loadLogout())
          return thunkApi.rejectWithValue('Unauthorized. Please, sign in. ')
        }
      }
      console.log('Unhandled error in request: ', e)
      return thunkApi.rejectWithValue(JSON.stringify(e))
    }
  }
)

export const loadLogout = createAsyncThunk<void, void, ThunkApiConfig>(
  'auth/loadLogout',
  async (_, thunkApi) => {
    try {
      await fetchLogout(selectAuth(thunkApi.getState()))
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e)
      return thunkApi.rejectWithValue(message)
    }
  }
)
