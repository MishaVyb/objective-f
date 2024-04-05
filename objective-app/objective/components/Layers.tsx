import { FC, useState } from 'react'
import {
  EyeClosedIcon,
  EyeOpenIcon,
  GroupIcon,
  LayersIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from '@radix-ui/react-icons'
import { Button, Flex, IconButton, Popover, Separator, Text } from '@radix-ui/themes'
import {
  ObjectiveKinds,
  ObjectiveMeta,
  isObjectiveHidden,
  isKindValue,
  isObjective,
} from '../meta/types'
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

import clsx from 'clsx'
import {
  actionChangeOpacityObjective,
  actionToggleElementLockObjective,
} from '../actions/actionElements'
import { getNotInternalElementsFromMeta } from '../meta/selectors'
import { isBoundToContainer } from '../../../packages/excalidraw/element/typeChecks'

const getElementTypesMap = (els: readonly ExcalidrawElement[] | ElementsMap) => {
  const elementTypesMap = new Map<ExcalidrawElementType, ExcalidrawElement[]>([])
  els.forEach((e) => {
    if (!elementTypesMap.get(e.type)) elementTypesMap.set(e.type, [])
    elementTypesMap.get(e.type)!.push(e)
  })
  return elementTypesMap
}

const Layer: FC<{
  close: () => void
  kind: ObjectiveKinds[] | ExcalidrawElementType[]
  name?: string
}> = ({ close, kind, name }) => {
  const app = useApp()
  const elsMap = app.scene.getNonDeletedElementsMap()
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const layerName = name || kind[0]

  let elementTypesMap: ReturnType<typeof getElementTypesMap> | undefined = undefined
  const elements: ExcalidrawElement[] = []
  const notInternalElements: ExcalidrawElement[] = []
  const elementIds: string[] = []
  const groupIds: string[] = []
  const metas: ObjectiveMeta[] = []
  // const objectiveInternals = getInvisibleBasisFromMetas(metas)

  for (const k of kind) {
    if (isKindValue(k)) {
      const currentKindMetas = app.scene.getObjectiveMetas()[k]!
      for (const meta of currentKindMetas) {
        metas.push(meta)
        elements.push(...meta.elements)
        notInternalElements.push(...getNotInternalElementsFromMeta(meta))
        elementIds.push(...meta.elements.map((e) => e.id))
        groupIds.push(meta.id)
      }
    } else {
      if (!elementTypesMap) elementTypesMap = getElementTypesMap(elsMap)

      const currentTypeElements = (elementTypesMap.get(k) || []).filter((e) => {
        if (isObjective(e)) return false
        if (isTextElement(e) && isObjective(getContainerElement(e, elsMap))) return false
        return true
      })
      elements.push(...currentTypeElements)
      notInternalElements.push(...currentTypeElements)
      elementIds.push(...currentTypeElements.map((e) => e.id))
    }
  }

  const onSelect = () => {
    close()
    setAppState({
      ...appState,
      selectedGroupIds: Object.fromEntries(groupIds.map((id) => [id, true])),
      selectedElementIds: Object.fromEntries(elementIds.map((id) => [id, true])),
    })
  }
  const onLock = () => {
    app.actionManager.executeAction(actionToggleElementLockObjective, 'internal', {
      elements,
      value: !isLocked,
    })
  }
  const onHide = () => {
    app.actionManager.executeAction(actionToggleElementLockObjective, 'internal', {
      elements,
      value: true,
    })
    app.actionManager.executeAction(actionChangeOpacityObjective, 'internal', {
      elements,
      value: 0,
    })
  }
  const onDisplay = () => {
    app.actionManager.executeAction(actionToggleElementLockObjective, 'internal', {
      elements,
      value: false,
    })
    app.actionManager.executeAction(actionChangeOpacityObjective, 'internal', {
      elements,
      value: lastUsedValue.opacity,
    })
  }
  const onChangeOpacity = (v: number) => {
    if (v === 0) onHide()
    else {
      app.actionManager.executeAction(actionToggleElementLockObjective, 'internal', {
        elements,
        value: false,
      })
      app.actionManager.executeAction(actionChangeOpacityObjective, 'internal', {
        elements,
        value: v,
      })
    }
  }

  const isLocked = notInternalElements.every((e) => e.locked)
  const isHidden = notInternalElements.every((e) => isObjectiveHidden(e))

  const COMMON_OPACITY_VALUE = 50
  let opacityValue: number | undefined
  for (const e of notInternalElements) {
    if (opacityValue === undefined) opacityValue = e.opacity
    if (opacityValue !== e.opacity) {
      if (isBoundToContainer(e)) continue // will take opecity from container, not from text inself
      if (e.opacity === 100) opacityValue = 100 // 100% always takes priority on other values
      else opacityValue = COMMON_OPACITY_VALUE
    }
  }

  const [lastUsedValue, setLastUsedValue] = useState({
    isHidden,
    isLocked,
    opacity: opacityValue!,
  })

  if (!elementIds.length) return null

  return (
    <>
      <Flex gap={'2'} align={'baseline'}>
        <Text
          className='capitalize-first'
          ml={'1'}
          size={'1'}
          style={{ minWidth: 100, userSelect: 'none' }}
        >
          {layerName}
        </Text>
        <IconButton
          className={clsx('objective-toggled-icon-button')}
          variant={'soft'}
          color={'gray'}
          size={'1'}
          onClick={onSelect}
        >
          <GroupIcon />
        </IconButton>
        <IconButton
          className={clsx(
            'objective-toggled-icon-button',
            { toggled: isLocked } //
          )}
          variant={'soft'}
          color={'gray'}
          size={'1'}
          onClick={onLock}
        >
          {isLocked ? <LockClosedIcon /> : <LockOpen1Icon />}
        </IconButton>
        <IconButton
          className={clsx(
            'objective-toggled-icon-button'
            // { toggled: isHidden } //
          )}
          variant={'soft'}
          color={'gray'}
          size={'1'}
          onClick={isHidden ? onDisplay : onHide}
        >
          {isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </IconButton>

        <label className='control-label'>
          <input
            type='range'
            min='0'
            max='100'
            step='10'
            onChange={(event) => onChangeOpacity(+event.target.value)}
            value={String(opacityValue)}
            onMouseUp={(e) => setLastUsedValue({ ...lastUsedValue, opacity: opacityValue! })}
          />
        </label>
      </Flex>
      <Separator size={'4'} m='1' />
    </>
  )
}

export const Layers: FC = () => {
  const [open, setOpen] = useState(false)
  const app = useApp()
  const elsMap = app.scene.getNonDeletedElementsMap()
  const appState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const isDisabled = !elsMap.size

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (v)
      setAppState({
        ...appState,
        selectedElementIds: {},
        selectedGroupIds: {},
        activeTool: {
          type: 'selection',
          customType: null,
          lastActiveTool: appState.activeTool,
          locked: appState.activeTool.locked,
        },
      })
    else
      setAppState({
        ...appState,
        activeTool: {
          type:
            appState.activeTool.lastActiveTool?.type &&
            appState.activeTool.lastActiveTool?.type !== 'custom'
              ? appState.activeTool.lastActiveTool.type
              : 'selection',
          customType: null,
          lastActiveTool: appState.activeTool,
          locked: appState.activeTool.locked,
        },
      })
  }
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger disabled={isDisabled}>
        <Button
          className='objective-gray-button' //
          mr={'2'}
          color={'gray'}
          variant='soft'
          disabled={isDisabled}
        >
          <LayersIcon />
          {'Layers'}
        </Button>
      </Popover.Trigger>
      <Popover.Content className={clsx('excalidraw', 'objective-popover-content')}>
        <Flex
          direction={'column'}
          style={{
            minHeight: 50,
            maxHeight: 430,
          }}
        >
          <Layer close={() => setOpen(false)} kind={['text']} />
          <Layer
            close={() => setOpen(false)}
            kind={[ObjectiveKinds.LABEL, ObjectiveKinds.LABEL_TEXT]}
          />
          <Layer close={() => setOpen(false)} kind={[ObjectiveKinds.CAMERA]} />
          <Layer close={() => setOpen(false)} kind={[ObjectiveKinds.LIGHT]} />
          <Layer close={() => setOpen(false)} kind={[ObjectiveKinds.CHARACTER]} />
          <Layer close={() => setOpen(false)} kind={[ObjectiveKinds.PROP]} />
          <Layer close={() => setOpen(false)} kind={[ObjectiveKinds.SET, ObjectiveKinds.OUTDOR]} />
          <Layer
            close={() => setOpen(false)}
            kind={[ObjectiveKinds.LOCATION, ObjectiveKinds.WALL]}
          />
          <Layer close={() => setOpen(false)} kind={['image']} />
          <Layer
            close={() => setOpen(false)}
            name={'Drawing'}
            kind={['arrow', 'diamond', 'ellipse', 'freedraw', 'rectangle']}
          />
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}
