import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk'
import { RootState } from './store'
import { resetAuth } from './auth/actions'

export interface ThunkApiConfig {
  rejectValue: string
  state: RootState
}

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
    let responseData

    if (e instanceof Response) {
      const response = e

      // Parse Response data safely
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      // Dispath known errors:
      if (response.status === 400 && responseData.detail === 'LOGIN_BAD_CREDENTIALS')
        return thunkApi.rejectWithValue('User does not exist or password incorrect. ')
      if (response.status === 400 && responseData.detail === 'REGISTER_USER_ALREADY_EXISTS')
        return thunkApi.rejectWithValue('User with that email already exist. ')
      if (response.status === 400 && responseData.detail === 'UPDATE_USER_EMAIL_ALREADY_EXISTS')
        return thunkApi.rejectWithValue('User with that email already exist. ')
      if (response.status === 401) {
        thunkApi.dispatch(resetAuth())
        return thunkApi.rejectWithValue('Unauthorized. Please, sign in. ')
      }
    }

    // Error not a Response or Unknown response error:
    console.error('Unknown error in request: ', responseData || e)
    return thunkApi.rejectWithValue('Something went wrong. Please, try again. ')
  }
}
