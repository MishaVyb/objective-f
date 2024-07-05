import { createStore, getMany, set, setMany, get, delMany } from 'idb-keyval'
import { ISceneFull, ISceneSimplified } from '../store/projects/reducer'

export class ScenesRepositoryClass {
  private store = createStore('scenes-db', 'scenes-store')

  async get(id: ISceneSimplified['id']) {
    try {
      return await get<ISceneFull>(id, this.store)
    } catch (e) {
      console.warn(e)
      return undefined
    }
  }

  async getMany(ids: ISceneSimplified['id'][]) {
    try {
      return (await getMany<ISceneFull>(ids, this.store)).filter((s) => s)
    } catch (e) {
      console.warn(e)
      return []
    }
  }

  async set(id: ISceneSimplified['id'], scene: ISceneFull) {
    try {
      return await set(id, scene, this.store)
    } catch (e) {
      console.warn(e)
    }
  }
  async setMany(entries: [ISceneSimplified['id'], ISceneFull][]) {
    try {
      return await setMany(entries, this.store)
    } catch (e) {
      console.warn(e)
    }
  }

  async delMany(ids: ISceneSimplified['id'][]) {
    try {
      return await delMany(ids, this.store)
    } catch (e) {
      console.warn(e)
    }
  }

  // UNUSED
  // async update(id: ISceneSimplified['id'], scene: ISceneFull) {
  //   return await update<ISceneFull>(id, (current) => scene, this.store)
  // }
}

export const ScenesRepository = new ScenesRepositoryClass()
