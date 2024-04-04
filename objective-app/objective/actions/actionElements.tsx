import { newElementWith } from '../../../packages/excalidraw'
import { shouldLock } from '../../../packages/excalidraw/actions/actionElementLock'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { arrayToMap } from '../../../packages/excalidraw/utils'
import { ensureArray, isHiddenObjective } from '../meta/types'
import { register } from './register'

type TChangeOpacityObjective = {
  elements: ExcalidrawElement[]
  value: number
}

export const actionChangeOpacityObjective = register({
  name: 'changeOpacityObjective',
  trackEvent: false,
  perform: (elements, appState, payload: TChangeOpacityObjective) => {
    const elementsToAffectMap = new Map(payload.elements.map((el) => [el.id, el]))
    return {
      elements: elements.map((el) =>
        elementsToAffectMap.get(el.id)
          ? newElementWith(el, {
              opacity: payload.value,
            })
          : el
      ),
      appState: { ...appState },
      commitToHistory: true,
    }
  },
})

type TActionToggleElementLock = {
  elements?: ExcalidrawElement[]
  value?: boolean
}

export const actionToggleElementLockObjective = register({
  name: 'toggleElementLockObjective',
  trackEvent: { category: 'element' },

  perform: (elements, appState, payload: TActionToggleElementLock, app) => {
    const selectedElements =
      payload?.elements ||
      app.scene.getSelectedElements({
        selectedElementIds: appState.selectedElementIds,
        includeBoundTextElement: true,
        includeElementsInFrames: true,
      })

    if (!selectedElements.length) {
      return false
    }

    const nextLockState =
      payload?.value === undefined ? shouldLock(selectedElements) : payload.value

    const selectedElementsMap = arrayToMap(selectedElements)
    return {
      elements: elements.map((element) => {
        if (!selectedElementsMap.has(element.id)) {
          return element
        }

        return newElementWith(element, {
          locked: nextLockState,
          opacity: isHiddenObjective(element) ? 100 : element.opacity,
        })
      }),
      appState: {
        ...appState,
        selectedLinearElement: nextLockState ? null : appState.selectedLinearElement,
      },
      commitToHistory: true,
    }
  },
})
