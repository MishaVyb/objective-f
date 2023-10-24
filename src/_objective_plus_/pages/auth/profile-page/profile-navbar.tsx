import { ExitIcon, LoopIcon, PersonIcon } from '@radix-ui/react-icons'
import { Flex, Text } from '@radix-ui/themes'
import { FC, MouseEvent, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from '../../../hooks/redux'
import { loadLogout, resetRequestStatusAction } from '../../../store/auth/actions'
import { selectAuthIsPending } from '../../../store/auth/reducer'

const ProfileNavbar: FC = () => {
  const dispatch = useDispatch()

  const loading = useSelector(selectAuthIsPending)

  useEffect(
    () => () => {
      dispatch(resetRequestStatusAction())
    },
    [dispatch]
  )

  const onLogout = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    dispatch(loadLogout())
  }

  return (
    <Flex direction={'column'} width={'max-content'} pt={'2'} pr={'2'}>
      <NavLink to='/profile' end>
        <PersonIcon />
        <Text color={'blue'} size={'5'} ml={'2'}>
          Your profile
        </Text>
      </NavLink>
      <a href='.' onClick={onLogout}>
        {loading ? (
          <LoopIcon />
        ) : (
          <>
            <ExitIcon />
            <Text color={'gray'} size={'3'} ml={'2'}>
              Sign out
            </Text>
          </>
        )}
      </a>
    </Flex>
  )
}

export default ProfileNavbar
