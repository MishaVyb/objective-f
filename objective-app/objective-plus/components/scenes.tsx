import {
  CardStackPlusIcon,
  DashboardIcon,
  DotsVerticalIcon,
  EnterIcon,
  FilePlusIcon,
  ImageIcon,
  Link2Icon,
  ListBulletIcon,
  Pencil2Icon,
  ResetIcon,
  TextAlignBottomIcon,
  TextAlignTopIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import {
  Badge,
  Box,
  Button,
  Code,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Select,
  Separator,
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
  loadCopyScene,
  loadCreateScene,
  loadDeleteScene,
  loadFileFromLocalOrServer,
  loadProject,
  loadProjects,
  loadScene,
  loadUpdateProject,
  loadUpdateScene,
  renderSceneAction,
  setObjectivePlusStore,
} from '../store/projects/actions'
import {
  selectMyProjects,
  selectScenes,
  selectScenesMeta,
  selectProject,
  selectSceneRender,
  selectSceneFullInfo,
  selectSceneFiles,
} from '../../objective-plus/store/projects/selectors'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ACCENT_COLOR, DATE_FORMAT_OPTS } from '../constants'
import { getDefaultAppState } from '../../../packages/excalidraw/appState'
import { AppState } from '../../../packages/excalidraw/types'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'
import { loadFromJSON } from '../../../packages/excalidraw/data'
import { CustomDropDownMenuItem } from '../UI'
import { MySceneShareOptions } from '../../objective/components/TopRightUI'
import { selectAuth } from '../store/auth/reducer'
import { objectValues } from '../../objective/utils/types'
import { buildSceneUrl } from './app'
import { useViewport } from '../../objective/hooks/useVieport'
import { IProject, ISceneSimplified, OrderMode } from '../store/projects/reducer'
import { getSceneVisibleFileIds } from '../store/projects/hooks'

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

const AddSceneItem: FC = () => {
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

const SceneItem: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const sceneRef = useRef(null)
  const nameRef = useRef(null)
  const meta = useSelector(selectScenesMeta())

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

  if (meta?.view === 'list')
    return (
      <Table.Row onClick={() => onClick()} className='scene-row '>
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

  return (
    <SceneCard onClick={() => onClick()}>
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
      <SceneThumbnail scene={scene} />
    </SceneCard>
  )
}

const SceneDropDownMenu: FC<{ scene: ISceneSimplified; onRename: () => void }> = ({
  scene,
  onRename,
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const projects = useSelector(selectMyProjects)
  const otherProjects = projects.filter((p) => p.id !== scene.project_id)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const auth = useSelector(selectAuth)
  const isMyScene = scene.user_id === auth.user.id

  const onDelete = () => {
    dispatch(loadDeleteScene({ id: scene.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDuplicate = () => {
    // NOTE: do not change scene name here, used does it by himself if he wanna
    dispatch(loadCopyScene({ id: scene.id }))
      .unwrap()
      .then((scene) => {
        dispatch(loadProject({ id: scene.project_id }))
        dispatch(loadScene({ id: scene.id }))
      })
  }

  const onMoveTo = (p: IProject) => {
    dispatch(loadUpdateScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onCopyTo = (p: IProject) => {
    dispatch(loadCopyScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then((scene) => {
        dispatch(loadProject({ id: scene.project_id }))
        dispatch(loadScene({ id: scene.id }))
          .unwrap()
          .then((scene) => navigate(`/projects/${scene.project_id}`))
      })
  }

  const onExportClick = () => {
    // TMP solution
    const appStateOverrides: Partial<AppState> = {
      openDialog: { name: 'imageExport' },
    }
    navigate(`/scenes/${scene.id}`, { state: { appStateOverrides } })
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'1'}>
            <DotsVerticalIcon />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          style={{ minWidth: 180, paddingTop: '5px', paddingBottom: '5px' }}
          size={'1'}
          variant={'soft'} //
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {isMyScene && (
            <CustomDropDownMenuItem Icon={Pencil2Icon} text={'Rename'} onClick={onRename} />
          )}
          {isMyScene && (
            <>
              <DropdownMenu.Separator />
              <CustomDropDownMenuItem
                Icon={FilePlusIcon}
                text={'Duplicate'}
                onClick={onDuplicate} //
              />

              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger disabled={!otherProjects.length}>
                  <Flex>
                    <EnterIcon style={{ marginTop: 2, marginRight: 7 }} />
                    <Text>{'Move To'}</Text>
                  </Flex>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent sideOffset={10} alignOffset={1} style={{ minWidth: 100 }}>
                  {otherProjects.map((p) => (
                    <DropdownMenu.Item key={p.id} onClick={() => onMoveTo(p)}>
                      {p.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            </>
          )}
          <>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger disabled={!otherProjects.length}>
                <Flex>
                  <CardStackPlusIcon style={{ marginTop: 2, marginRight: 7 }} />
                  <Text>{'Copy To'}</Text>
                </Flex>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={10} alignOffset={1} style={{ minWidth: 100 }}>
                {otherProjects.map((p) => (
                  <DropdownMenu.Item key={p.id} onClick={() => onCopyTo(p)}>
                    {p.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
          </>

          <CustomDropDownMenuItem
            Icon={Link2Icon}
            text={'Share'}
            onClick={() => setShareDialogOpen(true)} //
          />

          <CustomDropDownMenuItem
            Icon={ImageIcon}
            text={'Export'}
            onClick={onExportClick} //
          />
          {isMyScene && <DropdownMenu.Separator />}
          {isMyScene && (
            <CustomDropDownMenuItem
              Icon={TrashIcon}
              text={'Delete'}
              color='red'
              onClick={onDelete}
            />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <Dialog.Content style={{ width: 500, minHeight: 200 }}>
          <MySceneShareOptions url={buildSceneUrl(scene.id)} />
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}

const SceneThumbnail: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const sceneId = scene.id
  const dispatch = useDispatch()
  const thumbnailRender = useSelector(selectSceneRender(['thumbnail', scene.id]))
  const sceneFullInfo = useSelector(selectSceneFullInfo(scene.id))
  const files = useSelector(selectSceneFiles(scene.id))

  // [1] load all files
  useEffect(() => {
    if (sceneFullInfo) {
      const fileIds = getSceneVisibleFileIds(sceneFullInfo) // needed files
      fileIds.forEach((fileId) => dispatch(loadFileFromLocalOrServer({ sceneId, fileId })))
    }
  }, [dispatch, sceneFullInfo])

  // [2] render thumbnail // NOTE: triggered on 'files' changes
  useEffect(() => {
    if (sceneFullInfo) {
      dispatch(renderSceneAction(['thumbnail', sceneId]))
    }
  }, [dispatch, sceneFullInfo, files])

  if (!thumbnailRender) return <></>
  const url = URL.createObjectURL(thumbnailRender.renderBlob)

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
      <img
        style={{
          maxHeight: 120,
          maxWidth: 165,
        }}
        src={url}
        alt=''
      />
    </Flex>
  )
}

const ScenesSectionHeader: FC = () => {
  const { width } = useViewport()
  const isSmallViewPort = width <= 768
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const meta = useSelector(selectScenesMeta())
  const dispatch = useDispatch()

  // TODO
  // load other user
  // const auth = useSelector(selectAuth)
  // const isMyProject = project?.user_id === auth.user.id
  // const user = useSelector(selectUser(project?.user_id))
  // useEffect(() => {
  //   if (!project) return
  //   if (!user) dispatch(loadUser({ id: project.user_id }))
  // }, [project, user])

  const onViewModeChange = (t: 'list' | 'icons') => {
    dispatch(setObjectivePlusStore({ scenesMeta: { ...meta, view: t } }))
  }
  const onOrderChange = (v: OrderMode) => {
    dispatch(setObjectivePlusStore({ scenesMeta: { ...meta, order: v } }))
  }

  return (
    <Flex
      style={{ width: '100%' }}
      justify={'between'}
      direction={isSmallViewPort ? 'column' : 'row'}
      align={'baseline'}
    >
      <Heading
        color={ACCENT_COLOR}
        weight={'light'} //
        ml={isSmallViewPort ? '2' : '5'}
        mb={'2'}
        style={{ textDecoration: 'underline', textDecorationThickness: '2px' }}
      >
        {project?.name}
        {/* TODO {user && <Badge>{user.username || user.email}</Badge>} */}
      </Heading>
      <Flex
        ml={isSmallViewPort ? '2' : '5'} //
        gap={'1'}
      >
        <Select.Root value={meta?.order} onValueChange={onOrderChange} size={'1'}>
          <Select.Trigger
            placeholder={'Scenes Order'}
            style={{ minWidth: 120 }} //
          />
          <Select.Content position={'popper'}>
            <Select.Group>
              <Select.Label>
                <Text>{'Scenes Order'}</Text>
              </Select.Label>
              <Select.Item value='alphabetical'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Alphabetical'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
              <Select.Separator />
              <Select.Item value='created'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Created'}</Text>
                  <TextAlignTopIcon style={{ marginTop: 3 }} />
                </Flex>
              </Select.Item>
              <Select.Item value='created.desc'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Created'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
              <Select.Separator />
              <Select.Item value='updated'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Modified'}</Text>
                  <TextAlignTopIcon style={{ marginTop: 3 }} />
                </Flex>
              </Select.Item>
              <Select.Item value='updated.desc'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Modified'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <IconButton
          title='List View'
          className={clsx(
            'objective-plus-toggled-icon-button',
            { toggled: meta?.view === 'list' } //
          )}
          variant={'soft'}
          size={'1'}
          onClick={() => onViewModeChange('list')}
        >
          <ListBulletIcon />
        </IconButton>
        <IconButton
          title='Icons View'
          className={clsx(
            'objective-plus-toggled-icon-button',
            { toggled: meta?.view === 'icons' } //
          )}
          variant={'soft'}
          size={'1'}
          onClick={() => onViewModeChange('icons')}
        >
          <DashboardIcon />
        </IconButton>
      </Flex>
    </Flex>
  )
}

const ScenesSection = () => {
  const { width } = useViewport()
  const isSmallViewPort = width <= 768
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const auth = useSelector(selectAuth)
  const meta = useSelector(selectScenesMeta())

  if (!project) return <></>

  const isMyProject = project.user_id === auth.user.id
  const onRecover = () =>
    dispatch(loadUpdateProject({ id: project.id, is_deleted: false }))
      .unwrap()
      .then(() => {
        dispatch(loadProjects({}))
      })

  if (project.is_deleted)
    return (
      <Flex
        style={{
          width: '100%',
          height: '100%',
        }}
        justify={'center'}
        align={'center'}
        direction={'column'}
        gap={'2'}
      >
        <Badge color='red'>
          <TrashIcon />
          {'This project has been deleted'}
        </Badge>
        {isMyProject && (
          <Button variant='outline' color='gray' size='1' onClick={onRecover}>
            <ResetIcon />
            {'Recover'}
          </Button>
        )}
      </Flex>
    )

  return (
    <Box p={isSmallViewPort ? '1' : '5'} style={{ width: '100%' }}>
      <ScenesSectionHeader />
      {meta?.view === 'list' ? <ScenesListAsTable /> : <ScenesListAsIcons />}
    </Box>
  )
}

const ScenesListAsTable: FC = () => {
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const scenes = useSelector(selectScenes(project?.id))
  return (
    <>
      {scenes.length ? (
        <Table.Root
          className='scene-table'
          style={{
            maxHeight: '70vh',
            overflowY: 'scroll',
          }}
        >
          <Table.Header>
            <Table.Row>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Title'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Date Created'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Date Modified'}
                </Text>
              </Table.Cell>
              <Table.Cell> </Table.Cell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {scenes.map((p) => (
              <SceneItem key={p.id} scene={p} />
            ))}
          </Table.Body>
        </Table.Root>
      ) : null}
      <AddSceneItem />
    </>
  )
}

const ScenesListAsIcons: FC = () => {
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const scenes = useSelector(selectScenes(project?.id))
  return (
    <Flex
      wrap={'wrap'}
      style={{
        maxHeight: '80vh',
        overflowY: 'scroll',
      }}
    >
      {scenes.map((p) => (
        <SceneItem key={p.id} scene={p} />
      ))}
      <AddSceneItem />
    </Flex>
  )
}

export default ScenesSection
