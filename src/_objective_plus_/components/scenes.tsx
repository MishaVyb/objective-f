import { DotsVerticalIcon, PlusIcon } from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
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
  loadScene,
  loadUpdateScene,
} from '../store/projects/actions'
import {
  IProject,
  ISceneSimplified,
  selectProjects,
  selectScenes,
  selectToggledProject,
} from '../store/projects/reducer'

const SceneCard: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <Box
      className={clsx('scene-card', className)}
      m={'2'}
      p={'2'}
      style={{
        width: 170,
        height: 70,
      }}
    >
      {children}
    </Box>
  )
}

const SceneNewItem: FC = () => {
  const project = useSelector(selectToggledProject)
  const dispatch = useDispatch()
  const [name, setName] = useState('Untitled Scene')
  const [open, setOpen] = useState(false)

  if (!project) return <></>

  const onCreate = () => {
    setOpen(false)
    dispatch(loadCreateScene({ name, project_id: project?.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }
  return (
    <SceneCard className='ghost'>
      <Flex
        align={'center'}
        justify={'center'}
        style={{
          height: '100%',
        }}
      >
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>
            <Text
              m='2'
              color={'blue'}
              style={{ paddingRight: 20 }} // HACK: center
            >
              <PlusIcon /> New Scene
            </Text>
          </Dialog.Trigger>

          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Scene</Dialog.Title>
            <Dialog.Description size='2' mb='4'>
              Create New Scene
            </Dialog.Description>

            <label>
              <Text as='div' size='1' mb='1' color={'gray'}>
                Name
              </Text>
              <TextField.Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Enter scene name'
                onKeyUp={(e) => e.key === 'Enter' && onCreate()}
              />
            </label>

            <Flex gap='3' mt='4' justify='end'>
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
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </SceneCard>
  )
}

const SceneItem: FC<{ scene: ISceneSimplified }> = ({ scene }) => {
  const dispatch = useDispatch()
  const projects = useSelector(selectProjects)
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
    dispatch(loadScene({ id: scene.id }))
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

  return (
    <SceneCard>
      <Flex justify={'between'}>
        <EditableText
          ref={ref}
          initialValue={scene.name}
          defaultValue='Untitled Scene'
          onSubmit={(v) => onRename(v)}
          toggled={isRenameToggled}
        />

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
              <DropdownMenu.SubTrigger>Move To</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                {projects
                  .filter((p) => p.id !== scene.project_id)
                  .map((p) => (
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
        color={'blue'}
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
        <SceneNewItem />
      </Flex>
    </Box>
  )
}

export default ScenesList
