import { CubeIcon, PersonIcon, ReaderIcon } from '@radix-ui/react-icons'
import { Badge, Flex, Heading, Link as RadixLink, Separator, Text, Tooltip } from '@radix-ui/themes'
import { FC, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from '../hooks/redux'
import { selectIsAuthenticated, selectUser } from '../store/auth/reducer'

export const ObjectiveLogo = () => {
  return (
    <Flex>
      <Heading weight={'light'}>Objective</Heading>
      <Badge color={'yellow'} m='2' size={'1'}>
        beta
      </Badge>
    </Flex>
  )
}

const NavLink: FC<{ to: string; children?: ReactNode }> = ({ to, children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <RadixLink
      style={{ cursor: 'pointer' }}
      underline={location.pathname === to ? 'always' : 'auto'}
      onClick={() => navigate(to)}
    >
      {children}
    </RadixLink>
  )
}

export const ObjectiveHeader = () => {
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)

  return (
    <Flex className='objective-header' pl={'5'} pr={'5'} align={'center'} justify={'between'}>
      {isAuth ? (
        <NavLink to={'/projects'}>
          <Text style={{ userSelect: 'none' }}>
            <CubeIcon />
            {' projects'}
          </Text>
        </NavLink>
      ) : (
        <NavLink to={'/about'}>
          <Text style={{ userSelect: 'none' }}>
            <ReaderIcon />
            {' about'}
          </Text>
        </NavLink>
      )}

      <Link to='/about'>
        <ObjectiveLogo />
      </Link>

      <Flex>
        {isAuth ? (
          <NavLink to={'/profile'}>
            <Tooltip content={user.username || user.email}>
              <PersonIcon />
            </Tooltip>
          </NavLink>
        ) : (
          <>
            <NavLink to={'/login'}>
              <Text size={'1'} weight={'bold'}>
                Sign In
              </Text>
            </NavLink>
            <Separator orientation={'vertical'} m={'2'} />
            <NavLink to={'/register'}>
              <Text size={'1'} color={'gray'}>
                Sign Up
              </Text>
            </NavLink>
          </>
        )}
      </Flex>
    </Flex>
  )
}
