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
  Separator,
  Spinner,
  Strong,
  Text,
  TextField,
} from '@radix-ui/themes'
import { FC, useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from '../../objective-plus/hooks/redux'
import {
  loadCreateProject,
  loadCreateScene,
  loadProjects,
  loadSceneInitial,
} from '../../objective-plus/store/projects/actions'
import {
  selectCurrentScene,
  selectIsOtherScene,
  selectProjects,
} from '../../objective-plus/store/projects/reducer'
import { Sidebar } from '../../../packages/excalidraw'
import { ACCENT_COLOR } from '../../objective-plus/constants'

export const MySceneShareOptions: FC<{ url?: string }> = (props) => {
  const url = props.url || window.location.href
  return (
    <>
      <Heading size={'3'} color={ACCENT_COLOR}>
        Public scene
      </Heading>

      <Separator size={'4'} mt={'1'} mb={'3'} />

      <Text as={'p'} size={'1'}>
        Everyone with a link <Strong>can view</Strong>, but can not edit this scene.{' '}
      </Text>
      <Flex gap={'1'} direction={'row'} justify={'between'} mt={'3'}>
        <TextField.Root style={{ flexGrow: 1 }} value={url} size='2' readOnly />
        <IconButton variant={'outline'} color={'gray'} ml={'auto'}>
          <ClipboardCopyIcon onClick={() => navigator.clipboard.writeText(url)} />
        </IconButton>
      </Flex>
    </>
  )
}

export const CopySceneDialog: FC<{ open: boolean; setOpen: (open: boolean) => void }> = ({
  open,
  setOpen,
}) => {
  const [isDuplicateLoading, setIsDuplicateLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const scene = useSelector(selectCurrentScene)
  const projects = useSelector(selectProjects)
  const [name, setName] = useState(`${scene?.name} (copy)`)
  const [projectSelect, setProjectSelect] = useState(projects[0]?.id)

  useEffect(() => {
    dispatch(loadProjects({}))
      .unwrap()
      .then((projects) => {
        if (!projects.length) dispatch(loadCreateProject({ name: 'Untitled Project' }))
      })
  }, [dispatch])

  if (!scene || !projects.length) return <></>

  const onDuplicate = () => {
    setIsDuplicateLoading(true) // FIXME doesn't work
    dispatch(loadSceneInitial({ id: scene.id }))
      .unwrap()
      .then((scene) =>
        dispatch(loadCreateScene({ ...scene, project_id: projectSelect, name: name }))
          .unwrap()
          .then((scene) => navigate('/projects'))
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
          <TextField.Root
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter scene name'
            onKeyUp={(e) => e.key === 'Enter' && onDuplicate()}
          />
          <Select.Root defaultValue={projects[0]?.id} onValueChange={setProjectSelect}>
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

          <Spinner loading={isDuplicateLoading}>
            <Button variant={'soft'} onClick={onDuplicate}>
              Duplicate
            </Button>
          </Spinner>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export const OtherSceneShareOptions = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Heading size={'2'}>Protected scene.</Heading>
      <Text as={'p'} size={'1'}>
        {'You can view, but can not edit this scene. '}
        <br />
        {'Make '}
        <Link weight={'bold'} onClick={() => setOpen(true)} className='objective-link'>
          {'copy '}
        </Link>
        {'to continue with editing.'}
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
        <Popover.Content
          style={{ width: 360 }}
          align={'end'} //
        >
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
