import { FC, useState } from 'react'
import DropdownMenuItem from '../../../packages/excalidraw/components/dropdownMenu/DropdownMenuItem'
import { useNavigate, useParams } from 'react-router-dom'
import { DownloadIcon, FilePlusIcon, Pencil2Icon } from '@radix-ui/react-icons'
import {
  Badge,
  Button,
  Dialog,
  Flex,
  Separator,
  Strong,
  Text,
  Blockquote,
  Heading,
  TextField,
} from '@radix-ui/themes'
import {
  useExcalidrawActionManager,
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { useDispatch, useSelector } from '../../objective-plus/hooks/redux'
import { loadProjects, loadUpdateScene } from '../../objective-plus/store/projects/actions'
import { ExportIcon, usersIcon } from '../../../packages/excalidraw/components/icons'
import { ACCENT_COLOR } from '../../objective-plus/constants'
import { actionSaveFileToDisk } from '../../../packages/excalidraw/actions'
import { MySceneShareOptions, OtherSceneShareOptions } from './TopRightUI'
import { selectIsOtherScene } from '../../objective-plus/store/projects/selectors'

const NewScene: FC = () => {
  const navigate = useNavigate()

  const handleSelect = () => navigate('/projects', { state: { openAddSceneDialog: true } })

  return (
    <DropdownMenuItem
      title='Open or create new scene'
      icon={<FilePlusIcon />}
      onSelect={handleSelect}
      data-testid='load-button'
      // shortcut={getShortcutFromShortcutName('loadScene')}
    >
      {'New Scene'}
    </DropdownMenuItem>
  )
}

const RenameScene: FC = () => {
  const [open, setOpen] = useState(false)
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const [name, setName] = useState(appState.name)
  const dispatch = useDispatch()
  const { sceneId } = useParams()

  const isOtherScene = useSelector(selectIsOtherScene)
  if (isOtherScene) return null

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (v) setAppState({ ...appState, openDialog: { name: 'objectiveRenameScene' } })
    else setAppState({ ...appState, openMenu: null, openDialog: null })
  }

  const onRename = () => {
    setAppState({ ...appState, name: name, openMenu: null, openDialog: null })
    dispatch(loadUpdateScene({ id: sceneId!, name: name }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  return (
    <>
      <DropdownMenuItem
        title='Edit scene name'
        icon={<Pencil2Icon />}
        onClick={() => onOpenChange(true)}
        data-testid='load-button'
        // shortcut={getShortcutFromShortcutName('loadScene')}
      >
        {'Rename Scene'}
      </DropdownMenuItem>

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Heading size={'3'} color={ACCENT_COLOR}>
            Rename Scene
          </Heading>
          <Separator size={'4'} mt={'3'} mb={'3'} />
          <TextField.Root
            mt={'3'}
            mb={'3'}
            value={name}
            onKeyUp={(e) => e.key === 'Enter' && onRename()}
            onChange={(e) => setName(e.target.value)}
          />

          <Flex gap='3' mt='4' justify='end'>
            <Button variant='soft' color='gray' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant={'soft'} //
              onClick={onRename}
            >
              Save
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

const SaveScene: FC = () => {
  const [open, setOpen] = useState(false)
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const actionManager = useExcalidrawActionManager()

  const isOtherScene = useSelector(selectIsOtherScene)
  if (isOtherScene) return null

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (v) setAppState({ ...appState, openDialog: { name: 'objectiveSaveScene' } })
    else setAppState({ ...appState, openMenu: null, openDialog: null })
  }

  const onSave = () => {
    onOpenChange(false)
    actionManager.executeAction(actionSaveFileToDisk, 'ui')
    setAppState({ ...appState, openMenu: null })
  }

  return (
    <>
      <DropdownMenuItem
        title='Save to a local file' // TODO ${getShortcutFromShortcutName("")}
        icon={ExportIcon}
        onClick={() => onOpenChange(true)}
        data-testid='load-button'
        // shortcut={getShortcutFromShortcutName('loadScene')}
      >
        <Flex style={{ width: '100%' }} justify={'between'}>
          {'Save As...'}
          <Badge color={'gray'}>{'offline'}</Badge>
        </Flex>
      </DropdownMenuItem>

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ minWidth: 400, maxWidth: 600, minHeight: 300 }}>
          <Flex direction={'column'}>
            <Flex justify={'between'}>
              <Heading size={'3'} color={ACCENT_COLOR}>
                {'Save Scene'}
              </Heading>
              <Badge color={'gray'}>{'offline'}</Badge>
            </Flex>

            <Separator size={'4'} mt={'3'} mb={'3'} />

            <Text size={'3'} mt={'2'} highContrast>
              All your data are saving in the Cloud permanently.
            </Text>

            <Blockquote size={'2'} mt={'2'} color={'gray'}>
              But if you are working <Strong>offline</Strong> it's nessasary to save your progress
              to a file which you can import later.
            </Blockquote>

            <Flex gap='3' mt='8' justify='center'>
              <Button variant={'outline'} onClick={onSave}>
                <DownloadIcon />
                {'Save to...'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

const ShareOption: FC = () => {
  const [open, setOpen] = useState(false)
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()

  const isOtherScene = useSelector(selectIsOtherScene)
  if (isOtherScene) return null

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (v) setAppState({ ...appState, openDialog: { name: 'objectiveShareOptions' } })
    else setAppState({ ...appState, openMenu: null, openDialog: null })
  }

  return (
    <>
      <DropdownMenuItem
        title='Share read-only link'
        icon={usersIcon}
        onClick={() => onOpenChange(true)}
        data-testid='load-button'
        // shortcut={getShortcutFromShortcutName('loadScene')}
      >
        {'Share Options'}
      </DropdownMenuItem>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ width: 500, minHeight: 200 }}>
          {isOtherScene ? <OtherSceneShareOptions /> : <MySceneShareOptions />}
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

export const ObjectiveMainMenu = {
  NewScene,
  RenameScene,
  SaveScene,
  ShareOption,
  //...
}
