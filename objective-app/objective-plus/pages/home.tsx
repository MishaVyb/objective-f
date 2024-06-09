import { Flex } from '@radix-ui/themes'
import ProjectsSection from '../components/projects'
import ScenesSection from '../components/scenes'

const HomePage = () => {
  return (
    <Flex>
      <ProjectsSection />
      <ScenesSection />
    </Flex>
  )
}

export default HomePage
