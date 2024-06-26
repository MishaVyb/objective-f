import {
  ElementsMap,
  ExcalidrawArrowElement,
  ExcalidrawElement,
  NonDeletedSceneElementsMap,
} from '../../../packages/excalidraw/element/types'

import { Mutable } from '../../../packages/excalidraw/utility-types'
import { newMetaReprElement, newPointerBeetween } from './_newElement'
import { getObjectiveBasis, getObjectiveMetas, getMetaSimple } from '../meta/_selectors'
import {
  AnyObjectiveMeta,
  ObjectiveKinds,
  ObjectiveMeta,
  PointerMeta,
  isCameraMeta,
  isKind,
  isObjective,
} from '../meta/_types'

import { getCameraMetaReprStr } from '../actions/actionCamera'

import { Vector, getElementCenter } from './_math'

import { createMetaRepr } from './_metaRepr'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { getContainerElement } from '../../../packages/excalidraw/element/textElement'
import { mutateMeta } from './_mutateElements'
import { rotateMultipleElements } from '../../../packages/excalidraw/element/resizeElements'
import { duplicateMeta } from '../meta/_initial'

export type DuplicateHandlerOpts = {
  shift?: Vector
  rotate?: { center: Vector; angle: number }

  newElementsMeta?: Partial<AnyObjectiveMeta>

  addPointerWith?: ObjectiveMeta
  addPointerSubkind?: PointerMeta['subkind']
  addPointerOverrides?: Partial<ExcalidrawArrowElement>
  addPointerReverseDirection?: boolean
}

/**
 * filters out element we do not copy directly: LABEL and LABEL_TEXT
 * (because it wll be add as copied extraElements later)
 */
export const duplicateObjectiveEventHandlerFilter = (
  selectedElements: ElementsMap,
  scene: Scene
) => {
  const excludeElementIds = new Set<string>([])
  const metasMap = new Map(getObjectiveMetas(selectedElements).map((m) => [m.id, m]))

  for (const e of selectedElements.values()) {
    if (!isObjective(e)) continue
    const weekMeta = getMetaSimple(e)

    if (isKind(weekMeta, ObjectiveKinds.LABEL) && metasMap.has(weekMeta.labelOf))
      excludeElementIds.add(e.id)

    if (isKind(weekMeta, ObjectiveKinds.LABEL_TEXT)) {
      //@ts-ignore
      const container = getContainerElement(e, scene.getNonDeletedElementsMap())
      const containerWeekMeta = isObjective(container) ? getMetaSimple(container) : null
      if (
        isKind(containerWeekMeta, ObjectiveKinds.LABEL) &&
        metasMap.has(containerWeekMeta.labelOf)
      )
        excludeElementIds.add(e.id)
    }
  }

  for (const id of excludeElementIds) selectedElements.delete(id)
  return selectedElements
}

/**
 * Objective logic on duplicate elements:
 *
 * @param newElements new (cloned/copied) elements
 *
 * Handle new elements:
 * - adjust position & rotation (if needed)
 *
 * Add extra elements:
 * - duplicate Pointers (if any)
 * - duplicate Labels (if any)
 *
 * it's assumed that elements metas already copied properly by duplicateMeta
 * @see {@link duplicateMeta}
 */
export const duplicateObjectiveEventHandler = (
  newElements: Mutable<ExcalidrawElement>[],
  opts?: DuplicateHandlerOpts & {
    scene: Scene
  }
) => {
  const extraNewEls: ExcalidrawElement[] = []

  const metas = getObjectiveMetas(newElements) as Mutable<ObjectiveMeta>[]
  metas.forEach((meta) => {
    if (opts?.newElementsMeta) meta = mutateMeta(meta, opts.newElementsMeta)

    if (opts?.shift) {
      // NOTE do nothing here with shift, as it's already applied at Excalidraw level at
      // duplicateElements.duplicateAndOffsetElement
    }
    if (opts?.rotate) {
      const center = getElementCenter(meta.basis!)
      rotateMultipleElements(
        new Map(),
        meta.elements,
        opts.scene!.getElementsMapIncludingDeleted(),
        undefined,
        undefined,
        false,
        center.x,
        center.y,
        opts.rotate.angle
      )
    }

    if (opts?.addPointerWith)
      extraNewEls.push(
        newPointerBeetween(
          opts?.addPointerReverseDirection
            ? getObjectiveBasis(meta)
            : getObjectiveBasis(opts.addPointerWith),
          opts?.addPointerReverseDirection
            ? getObjectiveBasis(opts.addPointerWith)
            : getObjectiveBasis(meta),

          // HACK we know for sure that those new els have no pointer between
          new Map([]) as NonDeletedSceneElementsMap,

          {
            scene: opts?.scene,
            subkind: opts.addPointerSubkind,
            overrides: opts?.addPointerOverrides,
          }
        )!
      )

    if (isCameraMeta(meta)) {
      if (meta.nameRepr)
        extraNewEls.push(
          ...createMetaRepr(
            meta,
            'nameRepr',
            getCameraMetaReprStr(meta, {
              name: opts?.newElementsMeta?.name,
              shotNumber: opts?.newElementsMeta?.shotNumber,
              shotVersion: opts?.newElementsMeta?.shotVersion,
            }),
            newMetaReprElement
          )
        )

    } else {
      // all other meta kinds
      if (meta.nameRepr)
        extraNewEls.push(...createMetaRepr(meta, 'nameRepr', meta.name!, newMetaReprElement))
    }
  })

  return extraNewEls
}
