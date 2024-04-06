import { FC, useState } from 'react'
import DropdownMenuItem from '../../../packages/excalidraw/components/dropdownMenu/DropdownMenuItem'
import { useNavigate, useParams } from 'react-router-dom'
import { FilePlusIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, TextFieldInput } from '@radix-ui/themes'
import {
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { useDispatch } from '../../objective-plus/hooks/redux'
import { loadProjects, loadUpdateScene } from '../../objective-plus/store/projects/actions'

const NewScene: FC = () => {
  const navigate = useNavigate()

  const handleSelect = () => {
    navigate('/projects', { state: { openAddSceneDialog: true } })
  }

  return (
    <DropdownMenuItem
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

  const onRename = () => {
    setOpen(false)
    setAppState({ ...appState, name: name })
    dispatch(loadUpdateScene({ id: sceneId!, name: name }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  return (
    <>
      <DropdownMenuItem
        icon={<Pencil1Icon />}
        onClick={() => setOpen(true)}
        data-testid='load-button'
        // shortcut={getShortcutFromShortcutName('loadScene')}
      >
        {'Rename Scene'}
      </DropdownMenuItem>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Description>Rename Scene</Dialog.Description>
          <TextFieldInput
            mt={'3'}
            mb={'3'}
            value={name}
            onKeyUp={(e) => e.key === 'Enter' && onRename()}
            onChange={(e) => setName(e.target.value)}
          />

          <Flex gap='3' mt='4' justify='end'>
            <Dialog.Close>
              <Button variant='soft' color='gray'>
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button
                variant={'soft'} //
                onClick={onRename}
              >
                Save
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

export const ObjectiveMainMenu = {
  NewScene,
  RenameScene,
  //...
}
