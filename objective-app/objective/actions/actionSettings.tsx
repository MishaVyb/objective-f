import { CODES, KEYS } from '../../../packages/excalidraw/keys'
import { AppState } from '../../../packages/excalidraw/types'
import { register } from './register'

export const actionSettings = register({
  name: 'toggleObjectiveSettings',
  viewMode: true,
  trackEvent: { category: 'menu', action: 'toggleObjectiveSettings' },
  perform: (_elements, appState, _, { focusContainer }) => {
    if (appState.openDialog?.name === 'objectiveSettings') {
      focusContainer()
    }
    return {
      appState: {
        ...appState,
        openDialog:
          appState.openDialog?.name === 'objectiveSettings'
            ? null
            : {
                name: 'objectiveSettings',
              },
      },
      commitToHistory: false,
    }
  },
})

export const actionToggleGridSnapMode = register({
  name: 'toggleGridSnapMode',
  viewMode: true,
  trackEvent: {
    category: 'canvas',
    predicate: (appState) => !appState.gridSize,
  },
  perform(elements, appState) {
    return {
      appState: {
        ...appState,
        gridSize: appState.gridSizeConfig,
        gridSnappingEnabled: !appState.gridSnappingEnabled, //
        objectsSnapModeEnabled: false,
      },
      commitToHistory: false,
    }
  },
  checked: (appState: AppState) => !!(appState.gridSize && appState.gridSnappingEnabled),
  predicate: (element, appState, props) => {
    return typeof props.gridModeEnabled === 'undefined'
  },
  contextItemLabel: 'Snap to grid',
  keyTest: (event) => !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.G,
})
