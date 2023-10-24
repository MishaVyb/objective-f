import { Button, Flex, Section, Text, TextField } from '@radix-ui/themes'
import clsx from 'clsx'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useDispatch, useSelector } from '../../../hooks/redux'
import { loadLogin, resetRequestStatusAction } from '../../../store/auth/actions'
import { selectAuthError, selectAuthIsPending } from '../../../store/auth/reducer'

import { EyeClosedIcon, EyeOpenIcon, SymbolIcon } from '@radix-ui/react-icons'

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

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

  const onFormChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('username', form.email) // NOTE `email` is used as `username` on login
    formData.append('password', form.password)

    dispatch(resetRequestStatusAction())
    dispatch(loadLogin(formData))
  }

  return (
    <Section className='objective-card'>
      <form onSubmit={(e) => onFormSubmit(e)}>
        <Flex pl={'9'} pr={'9'} justify={'center'} direction={'column'}>
          <Text ml={'1'}>Login to Objective Plus</Text>
          <TextField.Root mt={'5'}>
            <TextField.Input
              className={clsx({ 'error-text-field': error })}
              placeholder='Enter your email'
              type='email'
              name='email'
              autoComplete={'username'}
              radius={'large'}
              required
              onChange={onFormChange}
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
            />
            <TextField.Slot>
              <EyeIcon
                height='16'
                width='16'
                className='clickable-icon'
                onClick={() => setShowPassword(!showPassword)}
              />
            </TextField.Slot>
          </TextField.Root>
          <Button
            type={'submit'}
            variant='surface'
            size={'1'}
            mt={'7'}
            ml={'7'}
            mr={'7'}
            disabled={loading}
          >
            {loading ? <SymbolIcon /> : 'Login'}
          </Button>
        </Flex>
      </form>
    </Section>
  )
}

export default LoginPage
