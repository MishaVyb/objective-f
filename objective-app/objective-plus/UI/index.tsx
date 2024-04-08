import { PlusIcon } from '@radix-ui/react-icons'
import { DropdownMenu, Flex, Text } from '@radix-ui/themes'
import { FC } from 'react'

type TIcon = typeof PlusIcon
type DefaultProps = Parameters<typeof DropdownMenu.Item>[0]
type CustomProps = { text: string; Icon?: TIcon }

export const CustomDropDownMenuItem: FC<DefaultProps & CustomProps> = ({ text, Icon, ...rest }) => (
  <DropdownMenu.Item {...rest}>
    <Flex>
      {Icon && <Icon style={{ marginTop: 2, marginRight: 7 }} />}
      <Text>{text}</Text>
    </Flex>
  </DropdownMenu.Item>
)
