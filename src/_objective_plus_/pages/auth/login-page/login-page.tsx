import { Button, Flex, Heading, IconButton, Link, Text, TextField } from '@radix-ui/themes'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useDispatch, useSelector } from '../../../hooks/redux'
import { loadLogin, loadUser, resetRequestStatusAction } from '../../../store/auth/actions'
import { selectAuthError, selectAuthIsPending } from '../../../store/auth/reducer'

import { EyeClosedIcon, EyeOpenIcon, SymbolIcon } from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import { ObjectiveCard, RootBox } from '../../../components/layout'

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const dispatch = useDispatch()
  const loading = useSelector(selectAuthIsPending)
  const error = useSelector(selectAuthError)

  const EyeIcon = showPassword ? EyeOpenIcon : EyeClosedIcon

  useEffect(
    () => () => {
      dispatch(resetRequestStatusAction())
    },
    [dispatch]
  )

  const onFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (error) dispatch(resetRequestStatusAction()) // if was error, reset error message on edit
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    dispatch(resetRequestStatusAction())
    dispatch(loadLogin(form))
      .unwrap()
      .then(() => {
        dispatch(loadUser())
      })
  }

  return (
    <RootBox>
      {/* <form> tag to handle Enter key down as submit action */}
      <form onSubmit={(e) => onFormSubmit(e)}>
        <ObjectiveCard extraClass={{ 'error-border': error }}>
          <Heading ml={'1'} size={'3'} weight={'medium'}>
            Enter to Objective Plus
          </Heading>
          <TextField.Root mt={'5'}>
            <TextField.Input
              placeholder='Enter your email'
              type='email'
              name='email'
              autoComplete={'username'}
              required
              onChange={onFormChange}
              disabled={loading}
            />
          </TextField.Root>
          <TextField.Root mt={'1'}>
            <TextField.Input
              placeholder='Enter your password'
              type={showPassword ? 'text' : 'password'}
              name='password'
              autoComplete={'current-password'}
              required
              onChange={onFormChange}
              disabled={loading}
            />
            <TextField.Slot>
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                type='button'
                variant={'ghost'}
              >
                <EyeIcon />
              </IconButton>
            </TextField.Slot>
          </TextField.Root>

          {error && (
            <Text color={'red'} size={'1'} ml={'1'}>
              {error}
            </Text>
          )}

          <Flex justify={'center'} align={'center'} pt={'2'} pr={'2'} gap={'2'}>
            <Button type={'submit'} variant='surface' size={'2'} disabled={loading}>
              {loading ? <SymbolIcon /> : 'Sign In'}
            </Button>
          </Flex>
          <Text mt={'5'} size={'1'} color={'gray'}>
            Not registered?
            <Link ml={'1'} color={'blue'} onClick={() => navigate('/register')}>
              Sign Up
            </Link>
          </Text>
          <Text size={'1'} color={'gray'}>
            Forgot password?
            <Link ml={'1'} color={'blue'} onClick={() => navigate('/reset-password')}>
              Reset password
            </Link>
          </Text>
        </ObjectiveCard>
      </form>
    </RootBox>
  )
}

export default LoginPage
