import { FC, useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'

import { Flex, Theme } from '@radix-ui/themes'
import clsx from 'clsx'
import ExcalidrawApp from '../../../excalidraw-app/App'
import BackgroundImage from '../images/objective-bg-image-v1.png'
import AboutPage from '../pages/about'
import LoginPage from '../pages/auth/login-page/login-page'
import UpdateProfile from '../pages/auth/profile-page/update-profile'
import RegisterPage from '../pages/auth/register-page/register-page'
import ResetPasswordPage from '../pages/auth/reset-password-page/reset-password-page'
import NotFoundPage from '../pages/errors/not-found-page'
import HomePage from '../pages/home'
import { fetchErrorCheck } from '../utils/objective-api'
import { ObjectiveHeader } from './header'
import RouteDispatch from './route-dispatch'
import DebugPage from '../pages/debug'
import { ObjectiveErrorCollout } from './errors'
import { selectNotUserAPIErrors } from '../store/projects/reducer'
import { useSelector } from '../hooks/redux'

const ScheckSentry: FC = () => {
  console.info('ScheckSentry: info log')
  console.warn('ScheckSentry: warn log')
  console.error('ScheckSentry: error log')

  useEffect(() => {
    new Promise(fetchErrorCheck)
  }, [])

  return <NotFoundPage />
}

const ObjectivePlusApp: FC = () => {
  const location = useLocation()
  const excalidrawPath = location.pathname.match('/scenes/.*')
  const notUserErrors = useSelector(selectNotUserAPIErrors)

  return (
    <Theme
      style={{ height: '100%' }} // height: '100%' is required for any element above Excalidraw
      className={clsx(
        'excalidraw-app', // ???
        'excalidraw-app-overrides'
        // 'zoom-out' //
      )}
      appearance={'light'}
      accentColor={'violet'}
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
          <Route path='*' element={<Navigate to={'/projects'} />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/error' element={<ScheckSentry />} />
          <Route path='/debug' element={<DebugPage />} />
          <Route
            path='/projects'
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
        <ObjectiveErrorCollout className='allert-callout-container' errors={notUserErrors} />
      </Flex>
    </Theme>
  )
}

export default ObjectivePlusApp
