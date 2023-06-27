import { ExcalidrawElement } from '../../element/types'
import { ObjectiveMeta } from '../types/types'

export const getElementsMetas = (elements: readonly ExcalidrawElement[]) => {
  const metas: ObjectiveMeta[] = []
  elements.forEach((e) =>
    e.customData && e.customData.kind
      ? metas.push(e.customData as ObjectiveMeta) // add link on element / element group ???
      : null
  )
  return metas
}

