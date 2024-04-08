import { EyeClosedIcon, EyeOpenIcon, SymbolIcon } from '@radix-ui/react-icons'
import {
  Button,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  Link,
  Select,
  Text,
  TextField,
} from '@radix-ui/themes'
import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { objectKeys } from '../../../../objective/utils/types'
import { ObjectiveCard, RootBox } from '../../../components/layout'
import { useDispatch, useSelector } from '../../../hooks/redux'
import {
  IUserCreatePayload,
  loadLogin,
  loadRegister,
  resetRequestStatusAction,
} from '../../../store/auth/actions'
import {
  UserRoles,
  initialState,
  selectAuthError,
  selectAuthIsPending,
} from '../../../store/auth/reducer'
import { ACCENT_COLOR } from '../../../constants'

const RegisterPage: FC = () => {
  const [form, setForm] = useState({ password: '', ...initialState.user })
  const navigate = useNavigate()
  const loading = useSelector(selectAuthIsPending)
  const error = useSelector(selectAuthError)
  const dispatch = useDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const EyeIcon = showPassword ? EyeOpenIcon : EyeClosedIcon

  useEffect(
    () => () => {
      dispatch(resetRequestStatusAction())
    },
    [dispatch]
  )

  const onFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFieldChange(e.target.name as keyof IUserCreatePayload, e.target.value)
  }

  const onFieldChange = (key: keyof IUserCreatePayload, value: string) => {
    if (error) dispatch(resetRequestStatusAction()) // if was error, reset error message on edit
    setForm({ ...form, [key]: value })
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    dispatch(resetRequestStatusAction())
    dispatch(loadRegister(form))
      .unwrap()
      .then(() => {
        dispatch(loadLogin(form))
      })

    //
    // NOTE: we do not hold password value after form submit: reset form value
    setForm((state) => ({ ...state, password: '' }))
  }

  const requiredFieldsAreFilled = !!form.email && !!form.password

  return (
    <RootBox>
      {/* <form> tag to handle Enter key down as submit action */}
      <form onSubmit={(e) => onFormSubmit(e)}>
        <ObjectiveCard extraClass={{ 'error-border': error }}>
          <Heading ml={'1'} size={'3'} weight={'medium'}>
            Create an account at Objective Plus
          </Heading>

          <TextField.Root mt={'5'}>
            <TextField.Root
              value={form.email}
              placeholder='E-mail'
              type='email'
              name='email'
              autoComplete={'username'}
              onChange={onFormChange}
            />
          </TextField.Root>

          <TextField.Root>
            <TextField.Root
              value={form.password}
              placeholder='Password'
              type={showPassword ? 'text' : 'password'}
              name='password'
              autoComplete={'current-password'}
              onChange={onFormChange}
              required
            />
            <TextField.Slot>
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                variant={'ghost'}
                type={'button'}
              >
                <EyeIcon />
              </IconButton>
            </TextField.Slot>
          </TextField.Root>

          {/* <Separator size={'4'} mt={'3'} /> */}
          <TextField.Root mt={'3'}>
            <TextField.Root
              value={form.username}
              placeholder='Username'
              type='text'
              name='username'
              onChange={onFormChange}
            />
          </TextField.Root>

          <Select.Root
            value={form.role}
            name='role'
            onValueChange={(v) => onFieldChange('role', v)}
          >
            {/* @ts-ignore */}
            <Select.Trigger placeholder={'Select Role'} />
            <Select.Content>
              <Select.Group>
                <Select.Label>Role</Select.Label>
                {objectKeys(UserRoles).map((k) => (
                  <Select.Item key={k} value={k}>
                    {UserRoles[k]}
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Content>
          </Select.Root>

          <Text size='2' mt={'3'} m={'1'}>
            <Flex gap='2'>
              <Checkbox defaultChecked required /> I&apos;m ready to take part in beta testing.
            </Flex>
          </Text>

          {error && (
            <Text color={'red'} size={'1'} ml={'1'}>
              {error}
            </Text>
          )}

          <Flex justify={'center'} align={'center'} pt={'2'} pr={'2'} gap={'2'}>
            <Button variant='surface' size={'2'} disabled={loading || !requiredFieldsAreFilled}>
              {loading ? <SymbolIcon /> : 'Sign In'}
            </Button>
          </Flex>

          <Text mt={'5'} size={'1'} color={'gray'}>
            Already have an account?
            <Link ml={'1'} color={ACCENT_COLOR} onClick={() => navigate('/login')}>
              Sign Up
            </Link>
          </Text>
        </ObjectiveCard>
      </form>
    </RootBox>
  )
}

export default RegisterPage
