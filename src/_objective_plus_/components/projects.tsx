import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { Card, DropdownMenu, Flex, Heading, IconButton, Section, Text } from '@radix-ui/themes'
import { FC, useEffect } from 'react'
import { useDispatch, useSelector } from '../hooks/redux'
import { loadProjects } from '../store/projects/actions'
import { IProject, selectProjects } from '../store/projects/reducer'

const ProjectItem: FC<{ project: IProject }> = ({ project }) => {
  return (
    <Card
      // variant={'outline'}
      variant={'surface'}
      m='2'
      style={{
        width: 170,
        height: 70,
      }}
    >
      <Flex justify={'between'}>
        <Text size={'1'} weight={'bold'}>
          {project.name}
        </Text>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant={'ghost'} type={'button'}>
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
  const projects = useSelector(selectProjects)
  const dispatch = useDispatch()

  console.log(projects)

  useEffect(() => {
    dispatch(loadProjects({}))
  }, [dispatch])

  return (
    <Section p={'9'}>
      <Heading color={'blue'} weight={'medium'} ml={'2'}>
        Your Projects
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
