import { DotsVerticalIcon, PlusIcon, SymbolIcon } from '@radix-ui/react-icons'
import {
  Button,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes'
import clsx from 'clsx'
import { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  loadCreateProject,
  loadDeleteProject,
  loadProjects,
  loadUpdateProject,
  toggleProject,
} from '../store/projects/actions'
import {
  IProject,
  selectProjects,
  selectIsPending,
  selectToggledProjectId,
} from '../store/projects/reducer'
import { ACCENT_COLOR } from '../constants'

const ProjectNewItem: FC = () => {
  const dispatch = useDispatch()
  const [name, setName] = useState('Untitled Project')
  const [open, setOpen] = useState(false)

  const onCreate = () => {
    setOpen(false)
    dispatch(loadCreateProject({ name }))
      .unwrap()
      .then(
        (v) =>
          dispatch(loadProjects({}))
            .unwrap()
            .then(() => dispatch(toggleProject(v.id))) // select newly created project
      )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button
          style={{ paddingRight: 30 }} // HACK: center
          m='2'
          variant={'ghost'}
          radius={'none'}
        >
          <PlusIcon /> New Project
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }} onCloseAutoFocus={(e) => e.preventDefault()}>
        <Dialog.Title>Project</Dialog.Title>
        <Dialog.Description size='2' mb='4'>
          Create New Project
        </Dialog.Description>

        <label>
          <Text as='div' size='2' mb='1' weight='bold'>
            Name
          </Text>
          <TextField.Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter project name'
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
            <Button variant='soft' onClick={onCreate}>
              Create
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const ProjectItem: FC<{ project: IProject; toggled: boolean }> = ({ project, toggled }) => {
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)

  const onClick = () => {
    dispatch(toggleProject(project.id))
  }

  const onRenameActivate = () => {
    setOpen(true)
  }

  const onRename = () => {
    setOpen(false)
    dispatch(loadUpdateProject({ ...project, name: name || 'Untitled Project' }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDelete = () => {
    dispatch(loadDeleteProject({ id: project.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const renameDialogComponent = (
    <Dialog.Root //
      open={open}
      onOpenChange={setOpen}
    >
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Project</Dialog.Title>
        <Dialog.Description size='2' mb='4'>
          Rename Project
        </Dialog.Description>

        <label>
          <Text as='div' size='1' mb='1' color={'gray'}>
            Name
          </Text>
          <TextField.Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter scene name'
            onKeyUp={(e) => e.key === 'Enter' && onRename()}
          />
        </label>

        <Flex gap='3' mt='4' justify='end'>
          <Dialog.Close>
            <Button variant='soft' color='gray'>
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant={'soft'} onClick={() => onRename}>
              Update
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )

  const menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'2'}>
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
        <DropdownMenu.Separator />
        <DropdownMenu.Item color='red' onClick={onDelete}>
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
  return (
    <Flex justify={'between'}>
      <div
        style={{
          width: '80%', // leave some space for options button
        }}
        className={clsx('projects-toggled-item', { toggled: toggled })}
        onClick={onClick}
      >
        <Text color={toggled ? ACCENT_COLOR : 'gray'} ml='1' mr={'auto'}>
          {project.name}
        </Text>
      </div>
      {toggled && menu}
      {renameDialogComponent}
    </Flex>
  )
}

const ProjectsList = () => {
  const loading = useSelector(selectIsPending)
  const projects = useSelector(selectProjects)
  const dispatch = useDispatch()
  const toggledProject = useSelector(selectToggledProjectId)

  useEffect(() => {
    dispatch(loadProjects({}))
  }, [dispatch])

  return (
    <Flex
      m='2'
      style={{
        height: '100vh',
        width: '25vw', // // as scenes use `75vw`
        minWidth: 140,
      }}
      className='objective-box'
      direction={'column'} //
      gap={'1'}
    >
      <Heading ml={'2'} size={'2'}>
        Your Projects {loading && <SymbolIcon />}
      </Heading>
      <Separator mt='1' mb='4' size={'4'} />

      {projects.map((p) => (
        <ProjectItem key={p.id} project={p} toggled={p.id === toggledProject} />
      ))}
      <ProjectNewItem />
    </Flex>
  )
}

export default ProjectsList
