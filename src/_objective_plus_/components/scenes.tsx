import { DotsVerticalIcon, SymbolIcon } from '@radix-ui/react-icons'
import { Card, DropdownMenu, Flex, Heading, IconButton, Section } from '@radix-ui/themes'
import { FC, useEffect } from 'react'
import EditableText from '../UI/editable-text'
import { useDispatch, useSelector } from '../hooks/redux'
import { loadProjects, loadUpdateProject } from '../store/projects/actions'
import { IProject, selectProjects, selectProjectsIsPending } from '../store/projects/reducer'

const ProjectItem: FC<{ project: IProject }> = ({ project }) => {
  const dispatch = useDispatch()

  const onRename = (v: string) => {
    console.log(v)
    dispatch(loadUpdateProject({ ...project, name: v }))
  }
  return (
    <Card
      variant={'surface'}
      m='2'
      style={{
        width: 170,
        height: 70,
      }}
    >
      <Flex justify={'between'}>
        <EditableText initialValue={project.name} onSubmit={(v) => onRename(v)} />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant={'ghost'} type={'button'} mt={'1'}>
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
      </Flex>
    </Card>
  )
}

const ProjectsList = () => {
  const loading = useSelector(selectProjectsIsPending)
  const projects = useSelector(selectProjects)
  const dispatch = useDispatch()

  console.log(projects)

  useEffect(() => {
    dispatch(loadProjects({}))
  }, [dispatch])

  return (
    <Section p={'9'}>
      <Heading color={'blue'} weight={'medium'} ml={'2'}>
        Your Projects {loading && <SymbolIcon />}
      </Heading>
      <Flex wrap={'wrap'}>
        {projects.map((p) => (
          <ProjectItem key={p.id} project={p} />
        ))}
      </Flex>
    </Section>
  )
}

export default ProjectsList
