import { CameraIcon, ClipboardCopyIcon, PersonIcon } from '@radix-ui/react-icons'
import {
  Button,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Link,
  Popover,
  Select,
  Strong,
  Text,
  TextField,
} from '@radix-ui/themes'
import { FC, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from '../../_objective_plus_/hooks/redux'
import { loadCreateScene, loadSceneInitial } from '../../_objective_plus_/store/projects/actions'
import {
  selectCurrentScene,
  selectIsOtherScene,
  selectProjects,
} from '../../_objective_plus_/store/projects/reducer'
import { Sidebar } from '../../../packages/excalidraw' 

const MySceneShareOptions = () => {
  const url = window.location.href
  return (
    <>
      <Heading color={'blue'} size={'2'}>
        Public scene.
      </Heading>
      <Text as={'p'} size={'1'}>
        Everyone with a link <Strong>can view</Strong>, but can not edit this scene.{' '}
      </Text>
      <Flex gap={'1'} direction={'row'} justify={'between'} mt={'1'}>
        <TextField.Root style={{ flexGrow: 1 }}>
          <TextField.Input value={url} size='2' readOnly />
        </TextField.Root>
        <IconButton variant={'outline'} color={'gray'} ml={'auto'}>
          <ClipboardCopyIcon onClick={() => navigator.clipboard.writeText(url)} />
        </IconButton>
      </Flex>
    </>
  )
}

const CopySceneDialog: FC<{ open: boolean; setOpen: (open: boolean) => void }> = ({
  open,
  setOpen,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const scene = useSelector(selectCurrentScene)
  const projects = useSelector(selectProjects)
  const [name, setName] = useState(`${scene?.name} (copy)`)
  const [projectSelect, setProjectSelect] = useState(projects[0].id)

  if (!scene || !projects) return <></>

  const onDuplicate = () => {
    setOpen(false)
    dispatch(loadSceneInitial({ id: scene.id }))
      .unwrap()
      .then((scene) =>
        dispatch(loadCreateScene({ ...scene, project_id: projectSelect, name: name }))
          .unwrap()
          .then((scene) => navigate(`/scenes/${scene.id}`))
      )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content style={{ maxWidth: 450 }} onCloseAutoFocus={(e) => e.preventDefault()}>
        <Dialog.Title size={'2'}>Duplicate current Scene</Dialog.Title>

        <label>
          <Text as='div' size='1' mb='2' color={'gray'}>
            Name
          </Text>
          <TextField.Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter scene name'
            onKeyUp={(e) => e.key === 'Enter' && onDuplicate()}
          />
          <Select.Root defaultValue={projects[0].id} onValueChange={setProjectSelect}>
            <Select.Trigger
              mt={'2'}
              style={{
                width: '100%',
              }}
            />

            <Select.Content>
              <Select.Group>
                {projects.map((project) => (
                  <Select.Item key={project.id} value={project.id}>
                    {project.name}
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </label>

        <Flex gap='3' mt='4' justify='end'>
          <Dialog.Close>
            <Button variant='soft' color='gray'>
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant={'soft'} onClick={onDuplicate}>
              Duplicate
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const OtherSceneShareOptions = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Heading color={'blue'} size={'2'}>
        Protected scene.
      </Heading>
      <Text as={'p'} size={'1'}>
        You can view, but can not edit this scene. Make{' '}
        <Link weight={'regular'} onClick={() => setOpen(true)}>
          a copy
        </Link>{' '}
        to continue with editing.
      </Text>
      <CopySceneDialog open={open} setOpen={setOpen} />
    </>
  )
}
const TopRightUI = () => {
  const ref = useRef(null)
  const scene = useSelector(selectCurrentScene)
  const isOtherScene = useSelector(selectIsOtherScene)

  if (!scene) return <></>

  const onOpen = () => {}
  const onClose = () => {}

  return (
    <Flex gap={'2'}>
      <Popover.Root
        defaultOpen={isOtherScene}
        onOpenChange={(open) => (open ? onOpen() : onClose())} //
      >
        <Popover.Trigger>
          <IconButton ref={ref} variant={'outline'} color={'gray'}>
            <PersonIcon width='16' height='16' />
          </IconButton>
        </Popover.Trigger>
        <Popover.Content style={{ width: 360 }}>
          {isOtherScene ? <OtherSceneShareOptions /> : <MySceneShareOptions />}
        </Popover.Content>
      </Popover.Root>
      <Sidebar.Trigger
        className='default-sidebar-trigger'
        tab='ShotList'
        name='ShotList'
        icon={<CameraIcon />}
        title={'Shot List'}
      >
        <div className='sidebar-trigger__label'>{'Shot List'}</div>
      </Sidebar.Trigger>
    </Flex>
  )
}

export default TopRightUI
