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
import { ObjectiveKinds, ObjectiveMeta, isKindValue, isObjective } from '../meta/types'
import {
  ElementsMap,
  ExcalidrawElement,
  ExcalidrawElementType,
} from '../../../packages/excalidraw/element/types'
import {
  useApp,
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { isTextElement } from '../../../packages/excalidraw/element'
import { getContainerElement } from '../../../packages/excalidraw/element/textElement'

const getElementTypesMap = (els: readonly ExcalidrawElement[] | ElementsMap) => {
  const elementTypesMap = new Map<ExcalidrawElementType, ExcalidrawElement[]>([])
  els.forEach((e) => {
    if (!elementTypesMap.get(e.type)) elementTypesMap.set(e.type, [])
    elementTypesMap.get(e.type)!.push(e)
  })
  return elementTypesMap
}

const Layer: FC<{ kind: ObjectiveKinds[] | ExcalidrawElementType[]; name?: string }> = ({
  kind,
  name,
}) => {
  const app = useApp()
  const elsMap = app.scene.getNonDeletedElementsMap()
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const layerName = name || kind[0]

  let elementTypesMap: ReturnType<typeof getElementTypesMap> | undefined = undefined
  const elementIds: string[] = []
  const groupIds: string[] = []
  const metas: ObjectiveMeta[] = []

  const locked = false

  for (const k of kind) {
    if (isKindValue(k)) {
      for (const meta of app.scene.getObjectiveMetas()[k]) {
        metas.push(meta)
        elementIds.push(...meta.elements.map((e) => e.id))
        groupIds.push(meta.id)
      }
    } else {
      if (!elementTypesMap) elementTypesMap = getElementTypesMap(elsMap)

      const elements = (elementTypesMap.get(k) || []).filter((e) => {
        if (isObjective(e)) return false
        if (isTextElement(e) && isObjective(getContainerElement(e, elsMap))) return false
        return true
      })
      elementIds.push(...elements.map((e) => e.id))
    }
  }

  const onSelectAll = () => {
    setAppState({
      ...appState,
      selectedGroupIds: Object.fromEntries(groupIds.map((id) => [id, true])),
      selectedElementIds: Object.fromEntries(elementIds.map((id) => [id, true])),
    })
  }

  return (
    <Flex gap={'1'} align={'baseline'}>
      <Text className='capitalize-first' ml={'1'} size={'1'} style={{ minWidth: 100, userSelect: 'none' }}>
        {layerName}
      </Text>
      <IconButton size={'1'} variant={'soft'} color={'gray'} onClick={() => onSelectAll()}>
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
    <Popover.Root
    // open={true}
    >
      <Popover.Trigger>
        <Button
          className='objective-gray-button' //
          mr={'2'}
          color={'gray'}
          variant='soft'
        >
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
          <Layer kind={[ObjectiveKinds.LOCATION, ObjectiveKinds.WALL]} />
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
