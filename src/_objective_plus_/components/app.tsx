import { FC } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { Flex, Theme } from '@radix-ui/themes'
import ExcalidrawApp from '../../excalidraw-app'
import LoginPage from '../pages/auth/login-page/login-page'
import NotFoundPage from '../pages/errors/not-found-page'
import HomePage from '../pages/home'
import './../scss/app.scss'
import RouteDispatch from './route-dispatch'
import UpdateProfile from '../pages/auth/profile-page/update-profile'

const ObjectivePlusApp: FC = () => {
  const location = useLocation()

  if (location.pathname === '/scenes')
    return (
      <RouteDispatch loginRequired>
        <ExcalidrawApp />
      </RouteDispatch>
    )

  return (
    <div className='objective-plus-app'>
      <Theme appearance='light' accentColor='blue'>
        <Flex justify={'center'}>
          <Routes>
            <Route path='*' element={<NotFoundPage />} />
            <Route path='/' element={<HomePage />} />
            <Route
              path='/login'
              element={
                <RouteDispatch>
                  <LoginPage />
                </RouteDispatch>
              }
            />
            <Route
              path='/profile'
              element={
                <RouteDispatch loginRequired>
                  <UpdateProfile />
                </RouteDispatch>
              }
            />
            {/* <Route
        path="/register"
        element={
          <RouteDispatch>
            <RegisterPage />
          </RouteDispatch>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RouteDispatch>
            <ForgotPasswordPage />
          </RouteDispatch>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RouteDispatch>
            <ResetPasswordPage />
          </RouteDispatch>
        }
      />*/}
          </Routes>
        </Flex>
      </Theme>
    </div>
  )
}

export default ObjectivePlusApp
