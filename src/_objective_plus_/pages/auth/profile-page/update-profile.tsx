import {
  Cross2Icon,
  EyeClosedIcon,
  EyeOpenIcon,
  Pencil1Icon,
  SymbolIcon,
} from '@radix-ui/react-icons'
import { Button, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes'
import { ChangeEvent, FC, FormEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { objectEntries, objectKeys } from '../../../../_objective_/types/utils'
import { ObjectiveCard, RootBox } from '../../../components/layout'
import { useDispatch, useSelector } from '../../../hooks/redux'
import {
  IUserCreatePayload,
  loadUpdateUser,
  loadUser,
  resetRequestStatusAction,
} from '../../../store/auth/actions'
import {
  UserRoles,
  initialState,
  selectAuthError,
  selectAuthIsPending,
  selectUser,
} from '../../../store/auth/reducer'
import ProfileNavbar from './profile-navbar'

const UpdateProfile: FC = () => {
  const user = useSelector(selectUser)

  const [form, setForm] = useState<IUserCreatePayload>({ password: '', ...initialState.user })

  // User me be not loaded yet, so we define initialFormState every time `user` changed
  // and also we setForm values for actual `user` state.
  const initialFormState: IUserCreatePayload = useMemo(() => {
    const initial = {
      ...user,
      password: '',
    }
    setForm(initial)
    return initial
  }, [user])

  const initialUpdatesState: Readonly<{ [key in keyof IUserCreatePayload]: boolean }> = {
    username: false,
    email: false,
    password: false,
    role: false,
  }
  const [formUpdates, setFormUpdates] = useState(initialUpdatesState)
  const [toggleUpdate, setToggleUpdate] = useState(initialUpdatesState)

  const inputRefs: { [key in keyof IUserCreatePayload]: RefObject<HTMLInputElement> } = {
    email: useRef<HTMLInputElement>(null),
    username: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  }

  const loading = useSelector(selectAuthIsPending)
  const error = useSelector(selectAuthError)

  const dispatch = useDispatch()

  const [showPassword, setShowPassword] = useState(false)
  const EyeIcon = showPassword ? EyeOpenIcon : EyeClosedIcon

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  useEffect(() => {
    if (error) setForm(initialFormState)
  }, [error, initialFormState])

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
    const isChanged = value !== initialFormState[key]
    setFormUpdates({ ...formUpdates, [key]: isChanged })
    setForm({ ...form, [key]: value })
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const partialUpdateData = Object.fromEntries(
      objectEntries(form).filter(([key, value], index) => value !== initialFormState[key])
    )

    dispatch(loadUpdateUser(partialUpdateData))
    dispatch(resetRequestStatusAction())
    setFormUpdates(initialUpdatesState)
    setToggleUpdate(initialUpdatesState)

    // NOTE: we do not hold password value after form submit: reset form value
    setForm((state) => ({ ...state, password: '' }))
  }

  const onEditClick = (key: keyof IUserCreatePayload) => {
    setTimeout(() => inputRefs[key]?.current?.focus(), 0)
    setToggleUpdate({ ...toggleUpdate, [key]: true })
  }

  const onEditCancel = (key?: keyof IUserCreatePayload) => {
    if (!key) {
      // bulk cancel for all fields
      setForm(initialFormState)
      setFormUpdates(initialUpdatesState)
      setToggleUpdate(initialUpdatesState)
    } else {
      setForm({ ...initialFormState, [key]: initialFormState[key] })
      setFormUpdates({ ...toggleUpdate, [key]: initialUpdatesState[key] })
      setToggleUpdate({ ...toggleUpdate, [key]: initialUpdatesState[key] })
    }
  }

  const wasChanged = Object.values(formUpdates).some(Boolean)

  const getToggleUpdateController = (key: keyof IUserCreatePayload) => (
    <TextField.Slot>
      {toggleUpdate[key] ? (
        <IconButton onClick={() => onEditCancel(key)} type='button' variant={'ghost'}>
          <Cross2Icon />
        </IconButton>
      ) : (
        <IconButton onClick={() => onEditClick(key)} type='button' variant={'ghost'}>
          <Pencil1Icon />
        </IconButton>
      )}
    </TextField.Slot>
  )

  return (
    <RootBox>
      <form onSubmit={(e) => onFormSubmit(e)}>
        <Flex ml={'-9'}>
          <ProfileNavbar />
          <ObjectiveCard extraClass={{ 'error-border': error }}>
            <TextField.Root>
              <TextField.Input
                ref={inputRefs.email}
                value={form.email}
                placeholder='Update email'
                type='email'
                name='email'
                autoComplete={'username'}
                onChange={onFormChange}
                disabled={!toggleUpdate.email}
              />
              {getToggleUpdateController('email')}
            </TextField.Root>
            <TextField.Root>
              <TextField.Input
                ref={inputRefs.username}
                value={form.username}
                placeholder='Update username'
                type='text'
                name='username'
                onChange={onFormChange}
                disabled={!toggleUpdate.username}
              />
              {getToggleUpdateController('username')}
            </TextField.Root>
            <TextField.Root>
              <TextField.Input
                ref={inputRefs.password}
                value={form.password}
                placeholder='Update password'
                type={showPassword ? 'text' : 'password'}
                name='password'
                autoComplete={'current-password'}
                onChange={onFormChange}
                disabled={!toggleUpdate.password}
              />
              {toggleUpdate.password && (
                <TextField.Slot>
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    type='button'
                    variant={'ghost'}
                  >
                    <EyeIcon />
                  </IconButton>
                </TextField.Slot>
              )}
              {getToggleUpdateController('password')}
            </TextField.Root>
            <Select.Root
              value={form.role}
              name='role'
              onValueChange={(v) => onFieldChange('role', v)}
            >
              {/* @ts-ignore */}
              <Select.Trigger placeholder={'Update Role'} />
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

            {error && (
              <Text color={'red'} size={'1'} ml={'1'}>
                {error}
              </Text>
            )}

            <Flex justify={'end'} align={'center'} pt={'2'} pr={'2'} gap={'2'}>
              {wasChanged && (
                <IconButton onClick={() => onEditCancel()} type='button' variant={'ghost'}>
                  <Cross2Icon />
                </IconButton>
              )}

              <Button variant={'outline'} size={'1'} disabled={loading || !wasChanged}>
                {loading ? <SymbolIcon /> : 'Update'}
              </Button>
            </Flex>
          </ObjectiveCard>
        </Flex>
      </form>
    </RootBox>
  )
}

export default UpdateProfile
