import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk'
import { RootState } from './store'
import { resetAuth } from './auth/actions'
import { APIError } from './projects/reducer'
import { ensureMap } from '../../objective/meta/types'

export interface ThunkApiConfig {
  rejectValue: APIError
  state: RootState
}

/*
Helper to make fetch request inside AsyncThunk's payloadCreator safely.
  - Await for callback.
  - Catch any error and return `thunkApi.rejectWithValue` in case.
*/
export const safeAsyncThunk = async <TResponse>(
  thunkApi: GetThunkAPI<ThunkApiConfig>,
  callback: () => Promise<TResponse>,
  customHandlers?: {
    _404?: (
      thunkApi: GetThunkAPI<ThunkApiConfig>,
      response: Response
    ) => ReturnType<typeof thunkApi.rejectWithValue> | TResponse
  }
) => {
  try {
    return await callback()
  } catch (e: any) {
    let responseData

    if (e instanceof Response) {
      const response = e

      // Parse Response data safely
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      if (response.status === 500)
        return thunkApi.rejectWithValue({
          type: 'ServerError',
          message: 'Something went wrong. Please, try again. ',
          detail: responseData.detail,
          status: response.status,
        })

      // Dispath known errors:
      if (response.status === 400 && responseData.detail === 'LOGIN_BAD_CREDENTIALS')
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'User does not exist or password incorrect. ',
          status: response.status,
        })
      if (response.status === 400 && responseData.detail === 'REGISTER_USER_ALREADY_EXISTS')
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'User with that email already exist. ',
          status: response.status,
        })
      if (response.status === 400 && responseData.detail === 'UPDATE_USER_EMAIL_ALREADY_EXISTS')
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'User with that email already exist. ',
          status: response.status,
        })
      if (response.status === 401) {
        thunkApi.dispatch(resetAuth())
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'Unauthorized. Please, sign in. ',
          status: response.status,
        })
      }

      if (response.status === 404) {
        if (customHandlers?._404) return customHandlers?._404(thunkApi, response)
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'Not found. ',
          status: response.status,
        })
      }
      if (response.status === 422 && responseData.detail[0].type === 'uuid_parsing') {
        return thunkApi.rejectWithValue({
          type: 'UserError',
          message: 'Invalid URL. ',
          status: response.status,
        })
      }
    }

    if (e instanceof Error) {
      if (e.message === 'Failed to fetch')
        return thunkApi.rejectWithValue({
          type: 'ConnectionError',
          message: 'No internet connection. ',
          detail: String(e),
        })
      return thunkApi.rejectWithValue({
        type: 'InternalError',
        message: 'Something went wrong. Please, try again. ',
      })
    }

    // Error not a Response or Unknown response error:
    console.error('Unknown error in request: ', responseData || e)
    return thunkApi.rejectWithValue({
      type: 'UnknownError',
      message: 'Something went wrong. Please, try again. ',
    })
  }
}

/** WARNING order is missing here*/
export const mergeArraysById = <T extends { id: string }>(prev: Array<T>, next: Array<T>) => {
  const prevMap = ensureMap(prev)
  const nextMap = ensureMap(next)
  const onlyPrevItems = []
  for (const [k, v] of prevMap.entries()) {
    if (!nextMap.has(k)) onlyPrevItems.push(v)
  }
  return [...onlyPrevItems, ...next]
}
