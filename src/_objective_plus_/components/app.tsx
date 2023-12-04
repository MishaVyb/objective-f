import { FC } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { Flex, Theme } from '@radix-ui/themes'
import ExcalidrawApp from '../../excalidraw-app'
import BackgroundImage from '../images/objective-bg-image-v1.png'
import AboutPage from '../pages/about'
import LoginPage from '../pages/auth/login-page/login-page'
import UpdateProfile from '../pages/auth/profile-page/update-profile'
import RegisterPage from '../pages/auth/register-page/register-page'
import ResetPasswordPage from '../pages/auth/reset-password-page/reset-password-page'
import NotFoundPage from '../pages/errors/not-found-page'
import HomePage from '../pages/home'
import './../scss/app.scss'
import { ObjectiveHeader } from './header'
import RouteDispatch from './route-dispatch'
import clsx from 'clsx'

const ObjectivePlusApp: FC = () => {
  const location = useLocation()
  const excalidrawPath = location.pathname.match('/scenes/.*')

  return (
    <Theme
      style={{ height: '100%' }} // height: '100%' is required for any element above Excalidraw
      className={clsx(
        'excalidraw-app',
        { 'is-collaborating': false }
        // 'zoom-out' //
      )}
      appearance='light'
      accentColor='blue'
      radius={'small'}
      scaling={'110%'}
    >
      <Flex // Base Layout container for the whole APP //
        style={{
          height: '100vh',
          backgroundImage: excalidrawPath ? undefined : `url(${BackgroundImage})`,
        }}
        className='objective-plus-app'
        direction={'column'}
      >
        {!excalidrawPath && <ObjectiveHeader />}
        <Routes>
          <Route path='*' element={<NotFoundPage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route
            path='/'
            element={
              <RouteDispatch loginRequired>
                <HomePage />
              </RouteDispatch>
            }
          />
          <Route
            path='/scenes/:sceneId'
            element={
              <RouteDispatch loginRequired>
                <ExcalidrawApp />
              </RouteDispatch>
            }
          />
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
          <Route
            path='/register'
            element={
              <RouteDispatch>
                <RegisterPage />
              </RouteDispatch>
            }
          />
          <Route
            path='/reset-password'
            element={
              <RouteDispatch>
                <ResetPasswordPage />
              </RouteDispatch>
            }
          />
          {/*
              TODO
              <Route
                path="/confirm-reset-password"
                element={
                  <RouteDispatch>
                    <ResetPasswordPage />
                  </RouteDispatch>
                }
          />*/}
        </Routes>
      </Flex>
    </Theme>
  )
}

export default ObjectivePlusApp
