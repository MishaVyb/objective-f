import { Button, Flex, IconButton, Section, Text, TextField } from '@radix-ui/themes'
import clsx from 'clsx'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useDispatch, useSelector } from '../../../hooks/redux'
import { loadLogin, loadUser, resetRequestStatusAction } from '../../../store/auth/actions'
import { selectAuthError, selectAuthIsPending } from '../../../store/auth/reducer'

import { EyeClosedIcon, EyeOpenIcon, SymbolIcon } from '@radix-ui/react-icons'

const LoginPage = () => {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const loading = useSelector(selectAuthIsPending)
  const error = useSelector(selectAuthError)

  const EyeIcon = showPassword ? EyeOpenIcon : EyeClosedIcon

  useEffect(
    () => () => {
      if (isFormSubmitted) dispatch(loadUser())
      dispatch(resetRequestStatusAction())
    },
    [dispatch, isFormSubmitted]
  )

  const onFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (error) dispatch(resetRequestStatusAction()) // if was error, reset error message on edit
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('username', form.email) // NOTE `email` is used as `username` on login
    formData.append('password', form.password)

    setIsFormSubmitted(true)
    dispatch(resetRequestStatusAction())
    dispatch(loadLogin(formData))
  }

  return (
    <Section className={clsx('objective-card', { 'error-border': error })}>
      <form onSubmit={(e) => onFormSubmit(e)}>
        <Flex pl={'9'} pr={'9'} justify={'center'} direction={'column'}>
          <Text ml={'1'}>Enter to Objective Plus</Text>
          <TextField.Root mt={'5'}>
            <TextField.Input
              placeholder='Enter your email'
              type='email'
              name='email'
              autoComplete={'username'}
              radius={'large'}
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
              radius={'large'}
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
              {loading ? <SymbolIcon /> : 'Sign Up'}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Section>
  )
}

export default LoginPage
