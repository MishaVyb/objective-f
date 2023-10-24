import {
  Cross2Icon,
  EyeClosedIcon,
  EyeOpenIcon,
  Pencil1Icon,
  SymbolIcon,
} from '@radix-ui/react-icons'
import { Button, Flex, Section, Select, TextField } from '@radix-ui/themes'
import { ChangeEvent, FC, FormEvent, MouseEvent, useEffect, useState } from 'react'
import { objectKeys } from '../../../../_objective_/types/utils'
import { useDispatch, useSelector } from '../../../hooks/redux'
import {
  IUserPayload,
  loadUser,
  resetRequestStatusAction,
  updateUser,
} from '../../../store/auth/actions'
import { selectAuthError, selectAuthIsPending, selectUser } from '../../../store/auth/reducer'
import ProfileNavbar from './profile-navbar'

enum UserRoles {
  DIRECTOR = 'Director',
  DOP = 'Director of Photography',
  OTHER = 'Other',
}

const UpdateProfile: FC = () => {
  const initialFormState: IUserPayload = {
    ...useSelector(selectUser),
    password: '',
  }

  const initialUpdatesState: { [key in keyof IUserPayload]: boolean } = {
    username: false,
    email: false,
    password: false,
    role: false,
  }
  const [formUpdates, setFormUpdates] = useState(initialUpdatesState)

  const loading = useSelector(selectAuthIsPending)
  const error = useSelector(selectAuthError)

  const dispatch = useDispatch()

  const [form, setForm] = useState(initialFormState)

  const [showPassword, setShowPassword] = useState(false)
  const EyeIcon = showPassword ? EyeOpenIcon : EyeClosedIcon

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  useEffect(
    () => () => {
      dispatch(resetRequestStatusAction())
    },
    [dispatch]
  )

  const onFormChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.name as keyof IUserPayload, e.target.value)

  const onChange = (key: keyof IUserPayload, value: string) => {
    const isChanged = value !== initialFormState[key]
    setFormUpdates({ ...formUpdates, [key]: isChanged })
    setForm({ ...form, [key]: value })
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    dispatch(updateUser(form))
    dispatch(resetRequestStatusAction())
    setFormUpdates(initialUpdatesState)

    // NOTE: we do not hold password value after form submit: reset form value
    setForm((state) => ({ ...state, password: '' }))
  }

  const onEditCancel = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setForm(initialFormState)
    setFormUpdates(initialUpdatesState)
    dispatch(resetRequestStatusAction())
  }

  const wasChanged = Object.values(formUpdates).some(Boolean)

  return (
    <Flex>
      <ProfileNavbar />
      <Section className='objective-card'>
        <form onSubmit={(e) => onFormSubmit(e)}>
          <Flex pl={'9'} pr={'9'} justify={'center'} direction={'column'} gap={'1'}>
            <TextField.Root>
              <TextField.Input
                value={form.email}
                placeholder='Update email'
                type='email'
                name='email'
                autoComplete={'username'}
                radius={'large'}
                onChange={onFormChange}
              />

              {formUpdates.email ? (
                <TextField.Slot>
                  <Pencil1Icon height='16' width='16' />
                </TextField.Slot>
              ) : null}
            </TextField.Root>
            <TextField.Root>
              <TextField.Input
                value={form.username}
                placeholder='Update username'
                type='text'
                name='username'
                radius={'large'}
                onChange={onFormChange}
              />

              {formUpdates.username ? (
                <TextField.Slot>
                  <Pencil1Icon height='16' width='16' />
                </TextField.Slot>
              ) : null}
            </TextField.Root>
            <TextField.Root>
              <TextField.Input
                value={form.password}
                placeholder='Update password'
                type={showPassword ? 'text' : 'password'}
                name='password'
                autoComplete={'current-password'}
                radius={'large'}
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
            <Select.Root value={form.role} name='role' onValueChange={(v) => onChange('role', v)}>
              <Select.Trigger radius={'large'} placeholder={'Update Role'} />
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

            <Flex justify={'end'} align={'center'} pt={'2'} pr={'2'} gap={'2'}>
              {/* @ts-ignore */}
              {wasChanged ? <Cross2Icon className='clickable-icon' onClick={onEditCancel} /> : null}
              <Button
                type={'submit'}
                variant={'outline'}
                size={'1'}
                disabled={loading || !wasChanged}
              >
                {loading ? <SymbolIcon /> : 'Update'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Section>
    </Flex>
  )
}

export default UpdateProfile
