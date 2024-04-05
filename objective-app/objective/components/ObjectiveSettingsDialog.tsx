import React from 'react'
import { Dialog } from '../../../packages/excalidraw/components/Dialog'
import {
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { AppState } from '../../../packages/excalidraw/types'
import { numberToStr } from '../elements/math'
import { __DEBUG_EDITOR } from '../../objective-plus/constants'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'

type Mode = {
  size: number
  freq: number
}

export const DEFAULT_GRID_MODE: Mode = { size: 25, freq: 4 }

const DEBUG_MODES = __DEBUG_EDITOR
  ? [
      { size: 2, freq: 50 },
      { size: 5, freq: 20 },
    ]
  : []

const MODES: Mode[] = [
  ...DEBUG_MODES,
  // 0.5m
  { size: 10, freq: 5 },
  { size: 25, freq: 2 },
  // 1m
  { size: 20, freq: 5 },
  DEFAULT_GRID_MODE,
  { size: 50, freq: 2 },
  // 2m
  { size: 20, freq: 10 },
  { size: 50, freq: 4 },
]

export const getGridMode = (appState: AppState | RestoredAppState) => {
  const { gridSizeConfig, gridBoldLineFrequency } = appState
  const modeIndex = MODES.findIndex(
    (v) => v.size === gridSizeConfig && v.freq === gridBoldLineFrequency
  )
  return modeIndex
}

export const getBoldLineGridScaleVerbose = (appState: AppState) => {
  return numberToStr((appState.gridSizeConfig * appState.gridBoldLineFrequency) / 100, {
    unit: 'm',
    roundVal: 1,
  })
}

export const ObjectiveSettingsDialog = ({ onClose }: { onClose?: () => void }) => {
  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const appState: AppState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const mode = getGridMode(appState)

  const setGridSize = (modeIndex: number) => {
    setAppState({
      ...appState,
      gridSize: MODES[modeIndex].size, // enable grid, even if it was disabled
      gridSizeConfig: MODES[modeIndex].size,
      gridBoldLineFrequency: MODES[modeIndex].freq,
    })
  }

  return (
    <Dialog onCloseRequest={handleClose} title={'Settings'} className={'objective-settings-dialog'}>
      <div style={{ marginTop: 10 }} className='panelColumn'>
        <label className='control-label'>
          Grid size
          <input
            type='range'
            min='0'
            max='6'
            step='1'
            onChange={(event) => setGridSize(+event.target.value)}
            value={mode}
            list='tickmarks'
          />
          {/* TODO REFACTOR RANGE OPTIONS VALUES */}
          {!DEBUG_MODES.length && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className='control-label'>0.5m</label>
                <label className='control-label'></label>
                <label className='control-label'>1m</label>
                <label className='control-label'></label>
                <label className='control-label'></label>
                <label className='control-label'>2m</label>
                <label className='control-label'></label>
              </div>
              <datalist id='tickmarks'>
                <option value='0'></option>
                <option value='1'></option>
                <option value='2'></option>
                <option value='3'></option>
                <option value='4'></option>
                <option value='5'></option>
                <option value='6'></option>
              </datalist>
            </>
          )}
        </label>
      </div>
    </Dialog>
  )
}
