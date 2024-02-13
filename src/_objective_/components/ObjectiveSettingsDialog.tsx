import React from 'react'
import { Dialog } from '../../../packages/excalidraw/components/Dialog'
import {
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { AppState } from '../../../packages/excalidraw/types'

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
  { size: 25, freq: 4 }, // 3
  { size: 50, freq: 2 }, // 4
  // 2m
  { size: 20, freq: 10 }, // 5
  { size: 50, freq: 4 }, // 6
]

const ScaleVerboseMap = {
  50: '0.5m',
  100: '1.0m',
  200: '2.0m',
}
const getMode = (gridSize: number, boldLineFreq: number) => {
  const modeIndex = MODES.findIndex((v) => v.size === gridSize && v.freq === boldLineFreq)
  if (modeIndex === -1) return 2 // fallbacks to default mode 2
  return modeIndex
}
export const getBoldLineGridScaleVerbose = (appState: AppState) => {
  //@ts-ignore
  return ScaleVerboseMap[appState.gridSizeConfig * appState.gridBoldLineFrequency]
}

export const ObjectiveSettingsDialog = ({ onClose }: { onClose?: () => void }) => {
  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const appState: AppState = useExcalidrawAppState()
  const setAppState = useExcalidrawSetAppState()
  const mode = getMode(appState.gridSizeConfig, appState.gridBoldLineFrequency)

  const setGridSize = (modeIndex: number) => {
    setAppState({
      ...appState,
      gridSize: appState.gridSize ? MODES[modeIndex].size : null,
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
