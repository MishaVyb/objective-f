import { Flex, Heading, Link, Text } from '@radix-ui/themes'
import { ObjectiveCard, RootBox } from '../components/layout'
import { FileTextIcon } from '@radix-ui/react-icons'
import { ACCENT_COLOR, CONTACT_AUTHOR_LINK } from '../constants'

const AboutPage = () => {
  return (
    <RootBox>
      <ObjectiveCard>
        <Flex style={{ minHeight: 200 }} direction={'column'}>
          <Heading color={ACCENT_COLOR}>Objective</Heading>
          <Text mt={'3'} size={'1'}>
            Service to plan your future shooting. <Link href={CONTACT_AUTHOR_LINK}>Support</Link>.
          </Text>
        </Flex>
      </ObjectiveCard>
    </RootBox>
  )
}

export default AboutPage
