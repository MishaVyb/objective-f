import { Flex } from '@radix-ui/themes'
import ProjectsSection from '../components/projects'
import ScenesSection from '../components/scenes'

const ProjectsPage = () => {
  return (
    <Flex
      style={{
        height: 'calc(100% - 40px)',
      }}
    >
      <ProjectsSection />
      <ScenesSection />
    </Flex>
  )
}

export default ProjectsPage
