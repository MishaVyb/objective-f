import { newElementWith } from '../../../packages/excalidraw'
import { shouldLock } from '../../../packages/excalidraw/actions/actionElementLock'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { arrayToMap } from '../../../packages/excalidraw/utils'
import { getInternalElementsSet } from '../meta/selectors'
import { isObjectiveHidden } from '../meta/types'
import { register } from './register'

type TChangeOpacityObjective = {
  elements: ExcalidrawElement[]
  value: number
}

export const actionChangeOpacityObjective = register({
  name: 'changeOpacityObjective',
  trackEvent: false,
  perform: (elements, appState, payload: TChangeOpacityObjective) => {
    const objectiveInternals = getInternalElementsSet(payload.elements)
    const elementsToAffectMap = new Map(
      payload.elements.filter((e) => !objectiveInternals.has(e)).map((el) => [el.id, el])
    )

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
    const internalObjective = getInternalElementsSet(selectedElements)

    if (!selectedElements.length) {
      return false
    }

    const nextLockState =
      payload?.value === undefined ? shouldLock(selectedElements) : payload.value

    const selectedElementsMap = arrayToMap(selectedElements)
    return {
      elements: elements.map((e) => {
        if (!selectedElementsMap.has(e.id)) {
          return e
        }

        return newElementWith(e, {
          locked: nextLockState,
          opacity: isObjectiveHidden(e) && !internalObjective.has(e) ? 100 : e.opacity,
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
