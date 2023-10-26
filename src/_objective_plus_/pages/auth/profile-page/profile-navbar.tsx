import { ExitIcon, PersonIcon } from '@radix-ui/react-icons'
import { Flex, Text } from '@radix-ui/themes'
import { FC, MouseEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { useDispatch } from '../../../hooks/redux'
import { loadLogout } from '../../../store/auth/actions'

const ProfileNavbar: FC = () => {
  const dispatch = useDispatch()

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
        <ExitIcon />
        <Text color={'gray'} size={'3'} ml={'2'}>
          Sign out
        </Text>
      </a>
    </Flex>
  )
}

export default ProfileNavbar
