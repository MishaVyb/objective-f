import { Action } from '../../../packages/excalidraw/actions/types'

export let objectiveActions: readonly Action[] = []

export const register = <T extends Action>(action: T) => {
  objectiveActions = objectiveActions.concat(action)
  return action as T & {
    keyTest?: unknown extends T['keyTest'] ? never : T['keyTest']
  }
}
