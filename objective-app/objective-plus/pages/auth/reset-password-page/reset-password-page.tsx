import { Heading, Link, Text } from '@radix-ui/themes'

import { ObjectiveCard, RootBox } from '../../../components/layout'
import { CONTACT_AUTHOR_LINK } from '../../../constants'

const ResetPasswordPage = () => {
  return (
    <RootBox>
      <ObjectiveCard>
        <Heading size={'3'} weight={'medium'}>
          Reset Password
        </Heading>
        <Text mt={'5'} size={'1'}>
          Please, contact <Link href={CONTACT_AUTHOR_LINK}>support</Link>.
        </Text>
      </ObjectiveCard>
    </RootBox>
  )
}

export default ResetPasswordPage
