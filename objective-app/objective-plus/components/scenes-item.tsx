import { FilePlusIcon } from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Checkbox,
  Code,
  Dialog,
  Flex,
  Separator,
  Spinner,
  Table,
  Tabs,
  Text,
  TextField,
} from '@radix-ui/themes'
import clsx from 'clsx'
import { FC, ReactNode, useEffect, useRef, useState } from 'react'
import EditableTextInput from '../UI/editable-text'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  loadCreateScene,
  loadProject,
  loadProjects,
  loadScene,
  loadUpdateScene,
  renderSceneAction,
} from '../store/projects/actions'
import {
  selectScenesMeta,
  selectProject,
  selectSceneRender,
  selectSceneFullInfo,
} from '../store/projects/selectors'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ACCENT_COLOR, DATE_FORMAT_OPTS } from '../constants'
import { getDefaultAppState } from '../../../packages/excalidraw/appState'
import { AppState } from '../../../packages/excalidraw/types'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'
import { loadFromJSON } from '../../../packages/excalidraw/data'
import { selectAuth } from '../store/auth/reducer'
import { objectValues } from '../../objective/utils/types'
import { ISceneSimplified } from '../store/projects/reducer'
import { useInView } from 'react-intersection-observer'
import { SceneDropDownMenu } from './scenes-dropdwon-menu'

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
        height: 170,
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  )
}

export const AddSceneItem: FC = () => {
  const { state } = useLocation()
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(state?.openAddSceneDialog || false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const meta = useSelector(selectScenesMeta())
  const auth = useSelector(selectAuth)
  const isMyProject = project?.user_id === auth.user.id

  // Excalidraw initialize appState from last openned scene (from local storage)
  const lastUsedAppState: RestoredAppState = getDefaultAppState()

  if (!project) return <></>
  if (!isMyProject) return <></>

  const onOpenChange = (open: boolean) => {
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
        files: [],
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
            project_id: project.id,
            appState: v.appState,
            elements: v.elements,
            files: objectValues(v.files),
          })
        )
          .unwrap()
          .then((scene) => {
            dispatch(loadProject({ id: scene.project_id }))
            dispatch(loadScene({ id: scene.id }))
          })
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
      {meta?.view === 'list' ? (
        <Box
          className={clsx('scene-card', 'ghost')}
          mb={'2'}
          pl={'2'}
          onClick={() => onOpenChange(true)}
        >
          <Flex align={'center'} style={{ height: '100%' }}>
            <Text m='2' color={ACCENT_COLOR} style={{ userSelect: 'none' }}>
              <FilePlusIcon />
              {' New Scene'}
            </Text>
          </Flex>
        </Box>
      ) : (
        <SceneCard className='ghost' onClick={() => onOpenChange(true)}>
          <Flex align={'center'} justify={'center'} style={{ height: '100%' }}>
            <Text
              m='2'
              color={ACCENT_COLOR}
              style={{
                userSelect: 'none',
                paddingRight: 20, // HACK: center
              }}
            >
              <FilePlusIcon />
              {' New'}
            </Text>
          </Flex>
        </SceneCard>
      )}

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
                    <TextField.Root
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
                    Open scene from <Code>.objective</Code> file
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

export const SceneItemRow: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const dispatch = useDispatch()

  const nameRef = useRef(null)

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

  const onClick = () => {
    navigate(`/scenes/${scene.id}`, { state: { projectId } })
  }

  // FIXME TIMEZONES
  const createdAt = new Date(
    scene.created_at.endsWith('Z') ? scene.created_at : scene.created_at + 'Z'
  )
  const updatedAt = scene.updated_at
    ? new Date(scene.updated_at.endsWith('Z') ? scene.updated_at : scene.updated_at + 'Z')
    : null

  return (
    <Table.Row onClick={() => onClick()} className='scene-row'>
      <Table.RowHeaderCell>
        <EditableTextInput
          ref={nameRef}
          initialValue={scene.name}
          defaultValue='Untitled Scene'
          onSubmit={(v) => onRename(v)}
          toggled={isRenameToggled}
        />
      </Table.RowHeaderCell>
      <Table.Cell>
        <Text color={'gray'} size={'1'}>
          {createdAt.toLocaleString('en-GB', DATE_FORMAT_OPTS)}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text color={'gray'} size={'1'}>
          {updatedAt ? updatedAt.toLocaleString('en-GB', DATE_FORMAT_OPTS) : '--'}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <SceneDropDownMenu scene={scene} onRename={onRenameActivate} />
      </Table.Cell>
    </Table.Row>
  )
}

export const SceneItemRowForExport: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const dispatch = useDispatch()

  const nameRef = useRef(null)

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

  const onClick = () => {}

  return (
    <Table.Row onClick={() => onClick()} className='scene-row'>
      <Table.RowHeaderCell>
        <EditableTextInput
          ref={nameRef}
          initialValue={scene.name}
          defaultValue='Untitled Scene'
          onSubmit={(v) => onRename(v)}
          toggled={isRenameToggled}
        />
      </Table.RowHeaderCell>
      <Table.Cell
        justify={'center'}
      >
        <Checkbox variant={'soft'} defaultChecked disabled/>
      </Table.Cell>
      <Table.Cell

      justify={'center'}>
        <Checkbox variant={'soft'} defaultChecked disabled/>
      </Table.Cell>
    </Table.Row>
  )
}

export const SceneItemIcon: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const { ref, inView, entry } = useInView()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const sceneRef = useRef(null)
  const nameRef = useRef(null)

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

  const onClick = () => {
    navigate(`/scenes/${scene.id}`, { state: { projectId } })
  }

  return (
    <Box
      ref={ref}
      className={clsx('scene-card', '')}
      m={'2'}
      p={'2'}
      style={{
        width: 170,
        height: 170,
      }}
      onClick={onClick}
    >
      <Flex ref={sceneRef} justify={'between'}>
        <EditableTextInput
          style={{ width: 123 }}
          ref={nameRef}
          initialValue={scene.name}
          defaultValue='Untitled Scene'
          onSubmit={(v) => onRename(v)}
          toggled={isRenameToggled}
        />
        <SceneDropDownMenu scene={scene} onRename={onRenameActivate} />
      </Flex>
      <Separator size={'4'} mt='1' />
      <SceneThumbnail scene={scene} inView={inView} />
    </Box>
  )
}

export const SceneThumbnail: FC<{ scene: ISceneSimplified; inView: boolean }> = ({
  scene,
  inView,
}) => {
  const sceneId = scene.id
  const dispatch = useDispatch()
  const thumbnailRender = useSelector(selectSceneRender(['thumbnail', scene.id]))
  const sceneFullInfo = useSelector(selectSceneFullInfo(scene.id))

  // UNUSED load all files, file will be loaded inside `renderSceneAction`
  //
  // useEffect(() => {
  //   if (sceneFullInfo) {
  //     const fileIds = getSceneVisibleFileIds(sceneFullInfo) // needed files
  //     fileIds.forEach((fileId) => dispatch(loadFileFromLocalOrServer({ sceneId, fileId })))
  //   }
  // }, [dispatch, sceneFullInfo])

  // render thumbnail
  useEffect(() => {
    if (inView && sceneFullInfo) {
      dispatch(renderSceneAction(['thumbnail', sceneId]))
    }
  }, [dispatch, sceneFullInfo, inView])

  return (
    <Flex
      style={{
        height: '85%',
      }}
      ml={'-1'}
      mr={'-1'}
      justify={'center'}
      align={'center'}
    >
      {inView && thumbnailRender ? (
        <img
          style={{
            maxHeight: 120,
            maxWidth: 165,
          }}
          src={thumbnailRender.renderWeekUrl}
          alt=''
        />
      ) : (
        <Spinner />
      )}
    </Flex>
  )
}
