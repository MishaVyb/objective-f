import { Flex, Kbd } from '@radix-ui/themes'
import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { isCameraElement, isObjective } from '../meta/types'
import { register } from './register'
import { getCameraVersionStr } from './actionShootList'

export const representationMeta = register({
  name: 'representationMeta',
  trackEvent: false,
  perform: (elements, appState, value) => {
    return false // No perform action, actually
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const metaKind = getFormValue(
      elements,
      appState,
      (element) => isObjective(element) && element.customData.kind,
      true,
      null
    )
    const shotNumber = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotNumber,
      true,
      null
    )
    const shotVersion = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotVersion,
      true,
      null
    )

    return (
      <Flex justify={'between'}>
        <Kbd>{metaKind}</Kbd>
        {shotNumber ? (
          <Kbd style={{ minWidth: 30 }}>
            {shotVersion ? `${shotNumber}-${getCameraVersionStr(shotVersion)}` : `${shotNumber}`}
          </Kbd>
        ) : null}
      </Flex>
    )
  },
})
