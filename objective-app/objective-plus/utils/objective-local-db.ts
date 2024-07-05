import { createStore, getMany, set, setMany, get, delMany } from 'idb-keyval'
import { ISceneFull, ISceneSimplified } from '../store/projects/reducer'

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
export type TSceneRenderVal = ISceneSimplified & {
  renderKind: SceneRenderKind
  renderMaxWidthOrHeight: number
  renderMimeType: string
  renderBlob: Blob
}
export type TSceneRenderSerializable = Omit<TSceneRenderVal, 'renderBlob'>

export class ScenesRenderRepositoryClass {
  private db = createStore('objective-db-renders', 'base')

  async get(id: TSceneRenderKey) {
    try {
      return await get<TSceneRenderVal>(id, this.db)
    } catch (e) {
      console.warn(e)
      return undefined
    }
  }
  async getMany(ids: TSceneRenderKey[]) {
    try {
      return (await getMany<TSceneRenderVal>(ids, this.db)).filter((s) => s)
    } catch (e) {
      console.warn(e)
      return []
    }
  }
  async set(id: TSceneRenderKey, scene: TSceneRenderVal) {
    try {
      return await set(id, scene, this.db)
    } catch (e) {
      console.warn(e)
    }
  }
  async setMany(entries: [TSceneRenderKey, TSceneRenderVal][]) {
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
