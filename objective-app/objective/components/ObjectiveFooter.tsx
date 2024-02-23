import { GridIcon, LinkBreak2Icon, MixerHorizontalIcon } from '@radix-ui/react-icons'
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
import { Code, Flex, IconButton, Tooltip } from '@radix-ui/themes'
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
        {appState.gridSize && (
          <Code color={'lime'} style={{ textDecoration: 'underline', paddingTop: '5px' }}>
            {scale}
          </Code>
        )}
        {appState.gridSize && (
          <Tooltip
            content={`Snap to grid — ${getShortcutFromShortcutName(actionToggleGridSnapMode.name)}`}
          >
            <IconButton
              variant={'outline'}
              className={clsx(
                'objective-toggled-icon-button',
                { active: appState.gridSnappingEnabled } //
              )}
              color={'gray'}
              onClick={() =>
                setAppState(
                  { ...appState, gridSnappingEnabled: !appState.gridSnappingEnabled } //
                )
              }
            >
              <LinkBreak2Icon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip content={`Show grid — ${getShortcutFromShortcutName(actionToggleGridMode.name)}`}>
          <IconButton
            variant={'outline'}
            className={clsx(
              'objective-toggled-icon-button',
              { active: appState.gridSize } //
            )}
            color={'gray'}
            onClick={() =>
              setAppState(
                { ...appState, gridSize: appState.gridSize ? null : appState.gridSizeConfig } //
              )
            }
          >
            <GridIcon />
          </IconButton>
        </Tooltip>
      </Flex>

      <div className='undo-redo-buttons'>
        <SettingsButton />
      </div>
    </Footer>
  )
})
