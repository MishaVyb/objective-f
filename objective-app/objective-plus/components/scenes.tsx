import { DotsVerticalIcon, PlusIcon } from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Code,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Tabs,
  Text,
  TextField,
} from '@radix-ui/themes'
import clsx from 'clsx'
import { FC, ReactNode, useRef, useState } from 'react'
import EditableText from '../UI/editable-text'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  loadCreateScene,
  loadDeleteScene,
  loadProjects,
  loadSceneInitial,
  loadUpdateScene,
} from '../store/projects/actions'
import {
  IProject,
  ISceneSimplified,
  selectProjects,
  selectScenes,
  selectToggledProject,
} from '../store/projects/reducer'
import { useNavigate } from 'react-router-dom'
import { ACCENT_COLOR } from '../constants'
import { getDefaultAppState } from '../../../packages/excalidraw/appState'
import { AppState } from '../../../packages/excalidraw/types'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'
import { loadFromJSON } from '../../../packages/excalidraw/data'

const DEFAULT_SCENE_NAME = 'Untitled Scene'

const SceneCard: FC<{ children: ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <Box
      className={clsx('scene-card', className)}
      m={'2'}
      p={'2'}
      style={{
        width: 170,
        height: 70,
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  )
}

const AddSceneItem: FC = () => {
  const project = useSelector(selectToggledProject)
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Excalidraw initialize appState from last openned scene (from local storage)
  const lastUsedAppState: RestoredAppState = getDefaultAppState()

  if (!project) return <></>

  const onOpenChange = (open: boolean) => {
    console.log(nameInputRef)
    setOpen(open)
    setTimeout(() => nameInputRef?.current?.focus(), 0)
  }

  const onCreate = () => {
    setOpen(false)
    dispatch(
      loadCreateScene({
        name: name || DEFAULT_SCENE_NAME,
        project_id: project?.id,
        appState: lastUsedAppState,
        elements: [],
      })
    )
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }
  const onOpenFile = () => {
    setOpen(false)
    loadFromJSON(lastUsedAppState as any as AppState, [])
      .then((v) =>
        dispatch(
          loadCreateScene({
            name: v.appState.name,
            project_id: project?.id,
            appState: v.appState,
            elements: v.elements,
          })
        )
          .unwrap()
          .then(() => dispatch(loadProjects({})))
      )
      .catch((error) => {
        if (error?.name === 'AbortError') {
          console.warn(error)
          return // do nothing
        }
        // TODO error dialog / message
        return
      })
  }

  return (
    <>
      <SceneCard className='ghost' onClick={() => onOpenChange(true)}>
        <Flex
          align={'center'}
          justify={'center'}
          style={{
            height: '100%',
          }}
        >
          <Text
            m='2'
            color={ACCENT_COLOR}
            style={{ paddingRight: 20 }} // HACK: center
          >
            <PlusIcon />
            {' Add'}
          </Text>
        </Flex>
      </SceneCard>

      <div onClick={(e) => e.stopPropagation()}>
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Content style={{ maxWidth: 450 }} onCloseAutoFocus={(e) => e.preventDefault()}>
            <Dialog.Title>Add Scene</Dialog.Title>

            <Tabs.Root defaultValue='new'>
              <Tabs.List size={'2'}>
                <Tabs.Trigger value='new'>New Scene</Tabs.Trigger>
                <Tabs.Trigger value='open'>Open Scene</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value='new'>
                <Flex style={{ height: 150 }} direction={'column'} justify={'between'}>
                  <Flex direction={'column'} mt='4' gap={'1'}>
                    <Text as='div' size='1' color={'gray'}>
                      Name
                    </Text>
                    <TextField.Input
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='Enter scene name'
                      onKeyUp={(e) => e.key === 'Enter' && onCreate()}
                    />
                  </Flex>
                  <Flex gap='3' justify='end'>
                    <Dialog.Close>
                      <Button variant='soft' color='gray'>
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                      <Button variant={'soft'} onClick={onCreate}>
                        Create
                      </Button>
                    </Dialog.Close>
                  </Flex>
                </Flex>
              </Tabs.Content>
              <Tabs.Content value='open'>
                <Flex style={{ height: 150 }} direction={'column'} justify={'between'}>
                  <Text as='div' size='2' mt='4' color={'gray'}>
                    Open <Code>.objective</Code> scene from local disk
                  </Text>
                  <Flex gap='3' justify='end'>
                    <Dialog.Close>
                      <Button variant='soft' color='gray'>
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                      <Button variant={'soft'} onClick={onOpenFile}>
                        Open File ...
                      </Button>
                    </Dialog.Close>
                  </Flex>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </>
  )
}

const SceneItem: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const projects = useSelector(selectProjects)
  const otherProjects = projects.filter((p) => p.id !== scene.project_id)
  const ref = useRef(null)
  const [isRenameToggled, setIsRenameToggled] = useState(false)

  const onRenameActivate = () => {
    setIsRenameToggled(true)
  }

  const onRename = (v: string) => {
    setIsRenameToggled(false)
    dispatch(loadUpdateScene({ id: scene.id, name: v }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDelete = () => {
    dispatch(loadDeleteScene({ id: scene.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDuplicate = () => {
    dispatch(loadSceneInitial({ id: scene.id }))
      .unwrap()
      .then((scene) =>
        dispatch(loadCreateScene({ ...scene, name: scene.name + ' [duplicate]' })) // TODO: counter
          .unwrap()
          .then(() => dispatch(loadProjects({})))
      )
  }

  const onMoveTo = (p: IProject) => {
    dispatch(loadUpdateScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onClick = () => {
    navigate(`/scenes/${scene.id}`)
  }

  return (
    <SceneCard onClick={() => onClick()}>
      <Flex justify={'between'}>
        <EditableText
          ref={ref}
          initialValue={scene.name}
          defaultValue='Untitled Scene'
          onSubmit={(v) => onRename(v)}
          toggled={isRenameToggled}
        />

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'1'}>
                <DotsVerticalIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              style={{ minWidth: 150 }}
              size={'1'}
              variant={'soft'} //
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenu.Item onClick={() => onRenameActivate()}>Rename</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => onDuplicate()}>Duplicate</DropdownMenu.Item>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger disabled={!otherProjects.length}>
                  Move To
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  {otherProjects.map((p) => (
                    <DropdownMenu.Item key={p.id} onClick={() => onMoveTo(p)}>
                      {p.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>

              <DropdownMenu.Separator />
              <DropdownMenu.Item>Share</DropdownMenu.Item>
              <DropdownMenu.Item>Export</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={onDelete} color='red'>
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </Flex>
    </SceneCard>
  )
}

const ScenesList = () => {
  const scenes = useSelector(selectScenes)
  const project = useSelector(selectToggledProject)

  if (!project || project.is_deleted) return <></>

  return (
    <Box
      p={'5'}
      style={{
        maxWidth: '75vw', // as projects use `25vw`
      }}
    >
      <Heading
        color={ACCENT_COLOR}
        weight={'light'} //
        ml={'5'}
        mb={'2'}
      >
        {project?.name}
      </Heading>
      <Flex wrap={'wrap'}>
        {scenes.map((p) => (
          <SceneItem key={p.id} scene={p} />
        ))}
        <AddSceneItem />
      </Flex>
    </Box>
  )
}

export default ScenesList
