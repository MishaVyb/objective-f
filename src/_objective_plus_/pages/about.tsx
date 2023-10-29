import { FC } from 'react'

import { Heading, Text } from '@radix-ui/themes'
import { ObjectiveCard, RootBox } from '../components/layout'

const AboutPage = () => {
  return (
    <RootBox>
      <ObjectiveCard>
        <Heading>About</Heading>
      </ObjectiveCard>
    </RootBox>
  )
}

export default AboutPage
