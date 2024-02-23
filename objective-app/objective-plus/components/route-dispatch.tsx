import { FC, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../store/auth/reducer'

interface IRouteDispatchProps {
  loginRequired?: boolean
  children?: ReactNode
}

const RouteDispatch: FC<IRouteDispatchProps> = ({ loginRequired, children }) => {
  const isAuth = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (loginRequired) {
    if (isAuth) return <>{children}</>
    return <Navigate to='/login' state={{ from: location.pathname }} />
  }

  if (isAuth) return <Navigate to={location?.state?.from || '/'} />
  return <>{children}</>
}

export default RouteDispatch
