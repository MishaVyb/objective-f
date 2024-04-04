import {
  GridIcon,
  LinkBreak2Icon,
  MixerHorizontalIcon,
  RulerHorizontalIcon,
  SizeIcon,
} from '@radix-ui/react-icons'
import { Footer } from '../../../packages/excalidraw'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'
import React from 'react'
import {
  useExcalidrawActionManager,
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { actionSettings } from '../actions'
import { AppState } from '../../../packages/excalidraw/types'
import { Code, Flex, IconButton, Kbd, Text, Tooltip } from '@radix-ui/themes'
import clsx from 'clsx'
import { getBoldLineGridScaleVerbose } from './ObjectiveSettingsDialog'
import { actionToggleGridMode } from '../../../packages/excalidraw/actions'
import { getShortcutFromShortcutName } from '../../../packages/excalidraw/actions/shortcuts'
import { actionToggleGridSnapMode } from '../actions/actionSettings'

const SettingsButton = () => {
  const actionManager = useExcalidrawActionManager()
  return (
    <ToolButton
      type='button'
      icon={<MixerHorizontalIcon />}
      onClick={() => actionManager.executeAction(actionSettings)}
      title={'Settings'}
      aria-label={'undefined'}
    />
  )
}

export const ObjectiveFooter = React.memo(() => {
  const appState: AppState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const scale = getBoldLineGridScaleVerbose(appState)

  return (
    <Footer>
      <Flex gap={'2'}>
        <Flex
          style={{ visibility: appState.gridSize ? 'inherit' : 'hidden' }}
          direction={'column'}
          justify={'center'}
          align={'center'}
        >
          <Text size={'1'} weight={'light'}>
            {scale}
          </Text>
          <RulerHorizontalIcon width={20} height={20} />
        </Flex>

        {appState.gridSize && (
          <IconButton
            title={`Snap to grid — ${getShortcutFromShortcutName(actionToggleGridSnapMode.name)}`}
            className={clsx(
              'objective-toggled-icon-button',
              { toggled: appState.gridSnappingEnabled } //
            )}
            variant={'soft'}
            color={'gray'}
            onClick={() =>
              setAppState(
                { ...appState, gridSnappingEnabled: !appState.gridSnappingEnabled } //
              )
            }
          >
            <LinkBreak2Icon />
          </IconButton>
        )}

        <IconButton
          title={`Show grid — ${getShortcutFromShortcutName(actionToggleGridMode.name)}`}
          className={clsx(
            'objective-toggled-icon-button',
            { toggled: appState.gridSize } //
          )}
          variant={'soft'}
          color={'gray'}
          onClick={() =>
            setAppState(
              { ...appState, gridSize: appState.gridSize ? null : appState.gridSizeConfig } //
            )
          }
        >
          <GridIcon />
        </IconButton>
      </Flex>

      <div className='undo-redo-buttons'>
        <SettingsButton />
      </div>
    </Footer>
  )
})
