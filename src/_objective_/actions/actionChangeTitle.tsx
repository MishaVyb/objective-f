import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { useApp } from '../../components/App'
import { isTextElement } from '../../element'
import { newElementWith } from '../../element/mutateElement'
import { t } from '../../i18n'
import { getSelectedElements } from '../../scene'
import { AppClassProperties } from '../../types'
import { TextField } from '../UI/TextField'
import { newNameRepr } from '../objects/primitives'
import { getCameraMetas } from '../selectors/selectors'
import { changeElementMeta, changeElementsMeta } from './helpers'
import { register } from './register'

/**
 * Change object Name (aka Title, aka Label)
 */
export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (elements, appState, { name, app }: { name: string; app: AppClassProperties }) => {
    const selectedCameras = getCameraMetas(getSelectedElements(elements, appState))
    selectedCameras.forEach((camera) => {
      if (name && !camera.nameRepr) {
        // add name repr:
        const [rectangle, text] = newNameRepr(camera, name)
        elements = changeElementMeta(elements, camera, { nameRepr: rectangle.id })
        elements = [...elements, rectangle, text]
        //-------------------------------------//
      } else if (name && camera.nameRepr) {
        // change repr text
        elements = elements.map((e) =>
          isTextElement(e) && e.containerId === camera.nameRepr
            ? newElementWith(e, {
                text: name,
                originalText: name,
              })
            : e
        )
        //-------------------------------------//
      } else if (!name && camera.nameRepr) {
        // remove name repr:
        elements = changeElementMeta(elements, camera, { nameRepr: undefined })
        elements = elements.map((e) =>
          e.id === camera.nameRepr || (isTextElement(e) && e.containerId === camera.nameRepr)
            ? newElementWith(e, { isDeleted: true })
            : e
        )
        //-------------------------------//
      }
    })

    elements = changeElementsMeta(elements, appState, { name })
    return {
      elements: elements,
      commitToHistory: !!name,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const app = useApp()
    const name = getFormValue(elements, appState, (element) => element.customData?.name, null)

    return (
      <TextField
        placeholder={t('labels.metaName', null, 'Label')}
        value={name || ''}
        onChange={(name) => updateData({ name, app })}
      />
    )
  },
})
