import { FC } from 'react'
import { ObjectiveCard, RootBox } from '../../components/layout'
import { Heading, Text } from '@radix-ui/themes'

const NotFoundPage: FC = () => {
  return (
    <RootBox>
      <ObjectiveCard>
        <Heading>404 Not Found</Heading>
        <Text>Такой страницы не существует :(</Text>
      </ObjectiveCard>
    </RootBox>
  )
}

export default NotFoundPage
