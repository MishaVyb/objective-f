import { FC } from 'react'
import {
  EyeClosedIcon,
  EyeOpenIcon,
  GroupIcon,
  LayersIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from '@radix-ui/react-icons'
import { Button, Flex, IconButton, Popover, Separator, Text } from '@radix-ui/themes'
import { ObjectiveKinds } from '../meta/types'
import { ExcalidrawElementType } from '../../../packages/excalidraw/element/types'
import { useApp, useExcalidrawAppState } from '../../../packages/excalidraw/components/App'

const Layer: FC<{ kind: ObjectiveKinds[] | ExcalidrawElementType[]; name?: string }> = ({
  kind,
  name,
}) => {
  const app = useApp()
  const appState = useExcalidrawAppState()
  const locked = false
  const layerName = name || kind[0]

  const onSelectAll = () => {}

  return (
    <Flex gap={'1'} align={'baseline'}>
      <Text ml={'1'} size={'1'} style={{ minWidth: 100, userSelect: 'none' }}>
        {layerName}
      </Text>
      <IconButton size={'1'} variant={'soft'} color={'gray'}>
        <GroupIcon />
      </IconButton>
      <IconButton size={'1'} variant={'soft'} color={'gray'}>
        {locked ? <LockClosedIcon /> : <LockOpen1Icon />}
      </IconButton>
      <IconButton size={'1'} variant={'soft'} color={'gray'}>
        <EyeClosedIcon />
      </IconButton>
      <IconButton size={'1'} variant={'soft'} color={'gray'} mr={'2'}>
        <EyeOpenIcon />
      </IconButton>

      <label className='control-label'>
        <input
          type='range'
          min='0'
          max='100'
          step='25'
          // onChange={(event) => updateData(+event.target.value)}
          value={'10'}
        />
      </label>
    </Flex>
  )
}

export const Layers: FC = () => {
  return (
    <Popover.Root open={true}>
      <Popover.Trigger>
        <Button color={'gray'} variant='soft'>
          <LayersIcon />
          {'Layers'}
        </Button>
      </Popover.Trigger>
      <Popover.Content className={'objective-popover-content'}>
        <Flex
          direction={'column'}
          style={{
            minHeight: 150,
            maxHeight: 430,
            // overflowY: 'scroll',
          }}
        >
          <Layer kind={[ObjectiveKinds.CAMERA]} />
          <Separator size={'4'} m='1' />
          <Layer kind={[ObjectiveKinds.LIGHT]} />
          <Separator size={'4'} m='1' />
          <Layer kind={[ObjectiveKinds.CHARACTER]} />
          <Separator size={'4'} m='1' />
          <Layer kind={[ObjectiveKinds.PROP]} />
          <Separator size={'4'} m='1' />
          <Layer kind={[ObjectiveKinds.SET, ObjectiveKinds.OUTDOR]} />
          <Separator size={'4'} m='1' />
          <Layer kind={[ObjectiveKinds.LOCATION]} />
          <Separator size={'4'} m='1' />
          <Layer kind={['image']} />
          <Separator size={'4'} m='1' />
          <Layer
            name={'Other'}
            kind={['arrow', 'diamond', 'ellipse', 'freedraw', 'rectangle', 'text']}
          />
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}
