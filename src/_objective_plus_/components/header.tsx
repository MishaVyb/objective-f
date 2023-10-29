import { Badge, Flex, Heading } from '@radix-ui/themes'

export const ObjectiveLogo = () => {
  return (
    <>
      <Heading mt={'1'} weight={'light'}>
        Objective Plus{' '}
      </Heading>{' '}
      <Badge m='1'>beta</Badge>
    </>
  )
}

export const ObjectiveHeader = () => {
  return (
    <header>
      <Flex align={'center'} justify={'center'}>
        <ObjectiveLogo />
      </Flex>
    </header>
  )
}
