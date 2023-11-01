import { Flex } from '@radix-ui/themes'
import { RootBox } from '../components/layout'
import ProjectsList from '../components/projects'

const HomePage = () => {
  return (
    // <RootBox>
      <Flex direction={'column'}>
        <ProjectsList />
        {/* <ProjectsList /> */}
      </Flex>
    // </RootBox>
  )
}

export default HomePage
