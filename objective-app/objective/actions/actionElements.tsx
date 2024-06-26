import { newElementWith } from '../../../packages/excalidraw'
import { shouldLock } from '../../../packages/excalidraw/actions/actionElementLock'
import { getBoundTextElement } from '../../../packages/excalidraw/element/textElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { arrayToMap } from '../../../packages/excalidraw/utils'
import { META_REPR_CONTAINER_INITIAL } from '../elements/_newElementObjectiveConstructors'
import { getInternalElementsSet, getObjectiveMetas } from '../meta/_selectors'
import { isObjectiveHidden } from '../meta/_types'
import { register } from './register'

type TChangeOpacityObjective = {
  elements: ExcalidrawElement[]
  value: number
}

export const actionChangeOpacityObjective = register({
  name: 'changeOpacityObjective',
  trackEvent: false,
  perform: (elements, appState, payload: TChangeOpacityObjective, app) => {
    const metas = getObjectiveMetas(payload.elements)
    const elsMap = app.scene.getNonDeletedElementsMap()

    const extraElements: ExcalidrawElement[] = []
    for (const meta of metas) {
      // label
      if (meta.nameRepr) {
        const containter = elsMap.get(meta.nameRepr) || null
        const text = getBoundTextElement(containter, elsMap)

        if (
          containter &&
          !isObjectiveHidden(containter) &&
          payload.value < META_REPR_CONTAINER_INITIAL().opacity!
        )
          extraElements.push(containter)

        if (text && !isObjectiveHidden(text)) extraElements.push(text)
      }
      // pinter
      const bounds = meta.basis?.boundElements
      if (bounds?.length) {
        bounds.forEach((e) => {
          const pointer = elsMap.get(e.id)
          if (pointer) extraElements.push(pointer)
        })
      }
    }

    const objectiveInternals = getInternalElementsSet(payload.elements)
    const elementsToAffectMap = new Map(
      [...payload.elements, ...extraElements]
        .filter((e) => !objectiveInternals.has(e))
        .map((el) => [el.id, el])
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
