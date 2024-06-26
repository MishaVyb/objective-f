import App from '../../../packages/excalidraw/components/App'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState } from '../../../packages/excalidraw/types'
import {
  extractObjectiveMetas,
  getObjectiveId,
  getSelectedSceneEls,
  groupByKind,
  isElementSelected,
} from './_selectors'
import {
  ObjectiveMeta,
  ObjectiveMetasGroups,
  ReadonlyMetasMap,
  isObjective,
  isSupportsTurn,
} from './_types'

/**
 * Objective read-only repository.
 * Provides access for Meta's over low-level Objective selectors.
 * */
export class ObjectiveMetaScene {
  /** NOTE: always present, even if there no App, see `__createSceneForElementsHack__` */
  private eScene: Scene
  /** WARNING: undefined at Export context or after App unmount */
  private app: App
  private created_at?: string

  private metasGroup = {} as ObjectiveMetasGroups
  private metasMap = new Map([]) as ReadonlyMetasMap

  constructor(app: App | undefined, eScene: Scene) {
    this.app = app as App
    this.eScene = eScene
  }

  _reaplaceAllElementsHook() {
    const [set, finalize] = extractObjectiveMetas()
    //
    // some extra logic... cache...

    const objectiveSceneSet = (el: ExcalidrawElement) => {
      set(el)
    }
    const objectiveSceneFinalize = () => {
      const metasMap = finalize()
      this.metasMap = metasMap
      this.metasGroup = groupByKind([...metasMap.values()])
    }

    //// @ts-ignore
    return [objectiveSceneSet, objectiveSceneFinalize] as [
      typeof objectiveSceneSet,
      typeof objectiveSceneFinalize
    ]
  }

  getMetasMap() {
    return this.metasMap
  }
  getMetasGroups() {
    return this.metasGroup
  }
  getMetasList() {
    return [...this.metasMap.values()]
  }
  getMeta(id: ObjectiveMeta['id']) {
    return this.metasMap.get(id)
  }
  getMetaByElement(element: ExcalidrawElement) {
    if (!isObjective(element)) return
    return this.getMeta(getObjectiveId(element))
  }
  getMetaByBasis(element: ExcalidrawElement) {
    const meta = this.getMetaByElement(element)
    if (meta && meta.basis!.id === element.id) return meta
    return undefined
  }

  //////////////////////////// NAME REPRESENTATION //////////////////

  getMetaByNameReprId(containerId: ObjectiveMeta['nameRepr']) {
    return this.getMetasList().find((meta) => meta.nameRepr === containerId)
  }

  //////////////////////////// TURNS ////////////////////////////////

  getTurnParent(
    child: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ): ObjectiveMeta | undefined {
    if (!isSupportsTurn(child)) return
    if (!child.turnParentId) return

    const turnParentItem = this.getMeta(child.turnParentId)
    if (!turnParentItem) return

    if (
      opts?.isSelected !== undefined &&
      isElementSelected(this.app.state, turnParentItem.basis!) !== opts.isSelected
    )
      return

    return turnParentItem
  }

  getTurnChildren(
    parent: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ): ObjectiveMeta[] {
    if (!isSupportsTurn(parent)) return []
    return this.metasGroup[parent.kind].filter(
      (m) =>
        isSupportsTurn(m) &&
        m.turnParentId === parent.id &&
        (opts?.isSelected === undefined || isElementSelected(this.app.state, m.basis!))
    )
  }

  /**
   * get all turns for this meta (parent + children)
   * @returns [] if no turns for this meta (do not return self meta in that case)
   */
  getTurns(
    meta: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ): ObjectiveMeta[] {
    if (!isSupportsTurn(meta)) return []

    // looking for all parent's children
    if (meta.turnParentId) {
      const parent = this.getTurnParent(meta)
      if (!parent) return []
      return [parent, ...this.getTurnChildren(parent, opts)]
    }

    // probably current meta is parent
    const children = this.getTurnChildren(meta)
    if (children.length) return [meta, ...children] // yep, its parent

    // meta has not child turns and it's not child itself
    return []
  }

  // TODO CACHE (populate map[meta.id, value] that once on every render loop and use populated value)
  getTurnNumber(
    meta: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ) {
    const index = this.getTurns(meta, opts).findIndex((turn) => turn.id === meta.id)
    return index === -1 ? undefined : index + 1
  }

  getNextTurn(
    meta: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ) {
    const turns = this.getTurns(meta, opts)
    const index = turns.findIndex((turn) => turn.id === meta.id)
    return index === -1 ? undefined : turns[index + 1]
  }
  /** get all turns for this meta (parent + children) excluding itself */
  getTurnsExcludingThis(
    meta: ObjectiveMeta,
    opts?: {
      isSelected?: boolean
    }
  ) {
    return this.getTurns(meta, opts).filter((m) => m.id != meta.id)
  }

  // TODO cache
  getSelectedMetas() {
    const metas: ObjectiveMeta[] = []
    const metaIds = new Set<ObjectiveMeta['id']>([])
    getSelectedSceneEls(this.eScene, this.app.state).forEach((el) => {
      if (isObjective(el)) {
        const objectiveId = getObjectiveId(el)
        if (!metaIds.has(objectiveId)) {
          metaIds.add(objectiveId)
          const m = this.getMeta(objectiveId)
          if (m) metas.push(m)
        }
      }
    })
    return metas
  }
  getSelectedSingleMeta<TMeta extends ObjectiveMeta = ObjectiveMeta>(): TMeta | undefined {
    const metas = this.getSelectedMetas()
    if (metas.length === 1) return metas[0] as TMeta
    return undefined
  }
  getSelectedSingleMetaStrict<TMeta extends ObjectiveMeta = ObjectiveMeta>(): TMeta | undefined {
    const selectedEls = getSelectedSceneEls(this.eScene, this.app.state)
    const meta = this.getSelectedSingleMeta<TMeta>()
    if (meta && meta.elements.length === selectedEls.length) return meta
    return undefined
  }
}
