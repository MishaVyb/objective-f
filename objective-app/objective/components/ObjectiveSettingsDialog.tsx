import React from 'react'
import { Dialog } from '../../../packages/excalidraw/components/Dialog'
import {
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { AppState } from '../../../packages/excalidraw/types'
import { numberToStr } from '../elements/math'

type Mode = {
  size: number
  freq: number
}

const MODES: Mode[] = [
  // 0.5m
  { size: 10, freq: 5 }, // 0
  { size: 25, freq: 2 }, // 1
  // 1m
  { size: 20, freq: 5 }, // 2
  { size: 25, freq: 4 }, // 3  -- DEFAULT
  { size: 50, freq: 2 }, // 4
  // 2m
  { size: 20, freq: 10 }, // 5
  { size: 50, freq: 4 }, // 6
]

export const DEFAULT_GRID_MODE = MODES[3]

const ScaleVerboseMap = {
  50: '0.5m',
  100: '1.0m',
  200: '2.0m',
}

export const getGridMode = (appState: AppState) => {
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
        </label>
      </div>
    </Dialog>
  )
}
