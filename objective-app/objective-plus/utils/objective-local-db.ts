import { createStore, getMany, set, setMany, get, delMany } from 'idb-keyval'
import { ISceneFull, ISceneSimplified } from '../store/projects/reducer'
import { filesStore } from '../../../excalidraw-app/data/LocalData'
import { BinaryFileData } from '../../../packages/excalidraw/types'

export class ScenesRepositoryClass {
  private db = createStore('objective-db-scenes', 'base')

  async get(id: ISceneSimplified['id']) {
    try {
      return await get<ISceneFull>(id, this.db)
    } catch (e) {
      console.warn(e)
      return undefined
    }
  }
  async getMany(ids: ISceneSimplified['id'][]) {
    try {
      return (await getMany<ISceneFull>(ids, this.db)).filter((s) => s)
    } catch (e) {
      console.warn(e)
      return []
    }
  }
  async set(id: ISceneSimplified['id'], scene: ISceneFull) {
    try {
      return await set(id, scene, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async setMany(entries: [ISceneSimplified['id'], ISceneFull][]) {
    try {
      return await setMany(entries, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async delMany(ids: ISceneSimplified['id'][]) {
    try {
      return await delMany(ids, this.db)
    } catch (e) {
      console.warn(e)
    }
  }

  // UNUSED
  // async update(id: ISceneSimplified['id'], scene: ISceneFull) {
  //   return await update<ISceneFull>(id, (current) => scene, this.db)
  // }
}
export const ScenesRepository = new ScenesRepositoryClass()

export type SceneRenderKind = 'thumbnail' | 'export'
export type TSceneRenderKey = [SceneRenderKind, ISceneSimplified['id']]

type _TSceneRenderBase = ISceneSimplified & {
  renderKind: SceneRenderKind
  renderMaxWidthOrHeight: number
  renderMimeType: string

  /**
   * UNUSED we render scene only with all files present
   *
   * files that included in blob render
   * @deprecated
   * */
  renderFileIds: BinaryFileData['id'][]
}
export type TSceneRenderRepo = _TSceneRenderBase & {
  /** blob to store in IndexedDB */
  renderBlob: Blob
}
export type TSceneRenderRedux = _TSceneRenderBase & {
  /** created in browser locally from current blob */
  renderWeekUrl: string
}

export class ScenesRenderRepositoryClass {
  private db = createStore('objective-db-renders', 'base')

  async get(id: TSceneRenderKey) {
    try {
      return await get<TSceneRenderRepo>(id, this.db)
    } catch (e) {
      console.warn(e)
      return undefined
    }
  }
  async getMany(ids: TSceneRenderKey[]) {
    try {
      return (await getMany<TSceneRenderRepo>(ids, this.db)).filter((s) => s)
    } catch (e) {
      console.warn(e)
      return []
    }
  }
  async set(id: TSceneRenderKey, scene: TSceneRenderRepo) {
    try {
      return await set(id, scene, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async setMany(entries: [TSceneRenderKey, TSceneRenderRepo][]) {
    try {
      return await setMany(entries, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async delMany(ids: TSceneRenderKey[]) {
    try {
      return await delMany(ids, this.db)
    } catch (e) {
      console.warn(e)
    }
  }

  // UNUSED
  // async update(id: ISceneSimplified['id'], scene: ISceneFull) {
  //   return await update<ISceneFull>(id, (current) => scene, this.db)
  // }
}
export const ScenesRenderRepository = new ScenesRenderRepositoryClass()

export class ScenesFileRepositoryClass {
  private db = filesStore

  async get(id: BinaryFileData['id']) {
    try {
      console.debug('[REPO][FILE] Getting instance: ', id)
      return await get<BinaryFileData>(id, this.db)
    } catch (e) {
      console.warn(e)
      return undefined
    }
  }
  async getMany(ids: BinaryFileData['id'][]) {
    try {
      return (await getMany<BinaryFileData>(ids, this.db)).filter((s) => s)
    } catch (e) {
      console.warn(e)
      return []
    }
  }
  async set(id: BinaryFileData['id'], scene: BinaryFileData) {
    try {
      return await set(id, scene, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async setMany(entries: [BinaryFileData['id'], BinaryFileData][]) {
    try {
      return await setMany(entries, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async delMany(ids: BinaryFileData['id'][]) {
    try {
      return await delMany(ids, this.db)
    } catch (e) {
      console.warn(e)
    }
  }

  // UNUSED
  // async update(id: ISceneSimplified['id'], scene: ISceneFull) {
  //   return await update<ISceneFull>(id, (current) => scene, this.db)
  // }
}
export const ScenesFileRepository = new ScenesFileRepositoryClass()
