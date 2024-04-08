import {
  DotsVerticalIcon,
  EnterIcon,
  FilePlusIcon,
  ImageIcon,
  Link2Icon,
  Pencil2Icon,
  TrashIcon,
} from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Code,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Separator,
  Tabs,
  Text,
  TextField,
} from '@radix-ui/themes'
import clsx from 'clsx'
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import EditableText from '../UI/editable-text'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  loadCreateScene,
  loadDeleteScene,
  loadProjects,
  loadSceneInitial,
  loadScenes,
  loadUpdateScene,
} from '../store/projects/actions'
import {
  IProject,
  ISceneFull,
  ISceneSimplified,
  selectProjects,
  selectSceneFullInfo,
  selectScenes,
  selectToggledProject,
} from '../store/projects/reducer'
import { useLocation, useNavigate } from 'react-router-dom'
import { ACCENT_COLOR } from '../constants'
import { getDefaultAppState } from '../../../packages/excalidraw/appState'
import { AppState, BinaryFileData } from '../../../packages/excalidraw/types'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'
import { loadFromJSON } from '../../../packages/excalidraw/data'
import { MIME_TYPES, exportToBlob } from '../../../packages/excalidraw'
import { getSceneVisibleFileIds, useFilesFromLocalOrServer } from '../store/projects/helpers'
import { isObjectiveHidden } from '../../objective/meta/types'
import { CustomDropDownMenuItem } from '../UI'
import { MySceneShareOptions } from '../../objective/components/TopRightUI'

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
  const project = useSelector(selectToggledProject)
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(state?.openAddSceneDialog || false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Excalidraw initialize appState from last openned scene (from local storage)
  const lastUsedAppState: RestoredAppState = getDefaultAppState()

  if (!project) return <></>

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

            // HACK
            // files migrations from one scene to another works out of the box, as we have the
            // same fileIds that shared among any scenes. So, when we use some ImageElement from
            // another scene at new scene, it will point to the same fileId
            // files: v.files,
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

// TODO
const ScenesThumbnailsCache = new Map<ISceneFull['id'], SVGSVGElement>([])

export const getSceneUrl = (id: ISceneFull['id']) => `${window.location.host}/scenes/${id}`

const SceneItem: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const projects = useSelector(selectProjects)
  const otherProjects = projects.filter((p) => p.id !== scene.project_id)
  const sceneFullInfo = useSelector(selectSceneFullInfo(scene.id))
  const nameRef = useRef(null)
  const [isRenameToggled, setIsRenameToggled] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const [thumbnailURL, setThumbnailURL] = useState('')
  const fetchFiles = useFilesFromLocalOrServer()
  const [files, setFiles] = useState<BinaryFileData[]>([])

  const buildThumbnailURL = useCallback(
    (files: BinaryFileData[]) => {
      if (!sceneFullInfo) return

      exportToBlob({
        elements: sceneFullInfo.elements.filter((e) => !isObjectiveHidden(e)),
        appState: {
          ...sceneFullInfo.appState,
          exportBackground: true,
          viewBackgroundColor: '#fdfcfd', // var(--gray-1)
        },
        maxWidthOrHeight: 500,
        files: Object.fromEntries(files.map((f) => [f.id, f])),
        mimeType: MIME_TYPES.png,
      }).then((blob) => {
        const url = URL.createObjectURL(blob)
        setThumbnailURL(url)
      })
    },
    [sceneFullInfo]
  )

  const addFilesCallback = useCallback(
    (filesToAppend: BinaryFileData[]) =>
      setFiles((currentFiles) => {
        if (!sceneFullInfo) return []

        const nextFiles = [...currentFiles, ...filesToAppend]
        buildThumbnailURL(nextFiles)

        return nextFiles
      }),
    [sceneFullInfo, buildThumbnailURL]
  )

  // build thumbnail on mount
  useEffect(() => {
    if (!sceneFullInfo) return
    const fileIds = getSceneVisibleFileIds(sceneFullInfo)
    if (fileIds.length) fetchFiles(scene.id, fileIds, addFilesCallback)
    else buildThumbnailURL([])
  }, [sceneFullInfo])

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
          .then(() => {
            dispatch(loadProjects({}))
            //
            // TODO request only 1 scene and insert that scene into store
            dispatch(loadScenes({}))
          })
      )
  }

  const onMoveTo = (p: IProject) => {
    dispatch(loadUpdateScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onExportClick = () => {
    // TMP solution
    const appStateOverrides: Partial<AppState> = {
      openDialog: { name: 'imageExport' },
    }
    navigate(`/scenes/${scene.id}`, { state: { appStateOverrides } })
  }

  const onClick = () => {
    navigate(`/scenes/${scene.id}`)
  }

  return (
    <SceneCard onClick={() => onClick()}>
      <Flex justify={'between'}>
        <EditableText
          ref={nameRef}
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
              style={{ minWidth: 180 }}
              size={'1'}
              variant={'soft'} //
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <CustomDropDownMenuItem
                Icon={Pencil2Icon}
                text={'Rename'}
                onClick={onRenameActivate}
              />
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

              <DropdownMenu.Separator />

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
              <DropdownMenu.Separator />
              <CustomDropDownMenuItem
                Icon={TrashIcon}
                text={'Delete'}
                color='red'
                onClick={onDelete}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <Dialog.Content style={{ width: 500, minHeight: 200 }}>
              <MySceneShareOptions url={getSceneUrl(scene.id)} />
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </Flex>
      <Separator size={'4'} mt='1' />
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
          src={thumbnailURL}
          alt=''
        />
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
