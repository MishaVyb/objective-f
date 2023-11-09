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
  loadProjects,
  loadUpdateProject,
  toggleProject,
} from '../store/projects/actions'
import {
  IProject,
  selectProjects,
  selectProjectsIsPending,
  selectToggledProject,
} from '../store/projects/reducer'

const ProjectNewItem: FC = () => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')

  const onCreate = () => {
    console.log('onCreate')
    dispatch(loadCreateProject({ name }))
      .unwrap()
      .then((v) => dispatch(loadProjects({})))
  }

  return (
    <Dialog.Root>
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

      <Dialog.Content style={{ maxWidth: 450 }}>
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
            // TODO:
            // onKeyUp={(e) => e.key === 'Enter' && onCreate()}
          />
        </label>

        <Flex gap='3' mt='4' justify='end'>
          <Dialog.Close>
            <Button variant='soft' color='gray'>
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button onClick={onCreate}>Create</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const ProjectItem: FC<{ project: IProject; toggled: boolean }> = ({ project, toggled }) => {
  const dispatch = useDispatch()

  const onClick = () => {
    dispatch(toggleProject(project.id))
  }

  const onRename = (v: string) => {
    console.log(v)
    dispatch(loadUpdateProject({ ...project, name: v }))
  }

  const menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'2'}>
          <DotsVerticalIcon />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item shortcut='⌘ E'>Edit</DropdownMenu.Item>
        <DropdownMenu.Item shortcut='⌘ D'>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item shortcut='⌘ N'>Archive</DropdownMenu.Item>

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Move to project…</DropdownMenu.Item>
            <DropdownMenu.Item>Move to folder…</DropdownMenu.Item>

            <DropdownMenu.Separator />
            <DropdownMenu.Item>Advanced options…</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />
        <DropdownMenu.Item>Share</DropdownMenu.Item>
        <DropdownMenu.Item>Add to favorites</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item shortcut='⌘ ⌫' color='red'>
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
        className={clsx('toggled-item', { active: toggled })}
        onClick={onClick}
      >
        <Text color={toggled ? 'blue' : 'gray'} ml='1' mr={'auto'}>
          {project.name}
        </Text>
      </div>
      {toggled && menu}
    </Flex>
  )
}

const ProjectsList = () => {
  const loading = useSelector(selectProjectsIsPending)
  const projects = useSelector(selectProjects)
  const dispatch = useDispatch()
  const toggledProject = useSelector(selectToggledProject)

  useEffect(() => {
    dispatch(loadProjects({}))
  }, [dispatch])

  return (
    <Flex
      m='2'
      style={{
        height: '100vh',
        width: '25vw',
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
