import { Flex } from '@radix-ui/themes'
import ProjectsList from '../components/projects'
import ScenesList from '../components/scenes'

const HomePage = () => {
  return (
    <Flex>
      <ProjectsList />
      <ScenesList />
    </Flex>
  )
}

export default HomePage
