import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { useApp } from '../../components/App'
import { isTextElement } from '../../element'
import { newElementWith } from '../../element/mutateElement'
import { getBoundTextElement, handleBindTextResize } from '../../element/textElement'
import { ExcalidrawElement } from '../../element/types'
import { t } from '../../i18n'
import { KEYS } from '../../keys'
import { getSelectedElements } from '../../scene'
import { AppClassProperties } from '../../types'
import { focusNearestParent } from '../../utils'
import { TextField } from '../UI/TextField'
import { newNameRepr } from '../objects/primitives'
import { getCameraMetas } from '../selectors/selectors'
import { changeElementMeta, changeElementProperty, changeElementsMeta } from './helpers'
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
        //
        // change repr text
        const container = elements.find((e) => e.id === camera.nameRepr) as ExcalidrawElement
        const textElement = getBoundTextElement(container)
        handleBindTextResize(container, false, { newOriginalText: name })

        // HACK
        // If we do not replace prev text element with mutated text element, it won't take effect.
        // Because inside `resizeSingleElement` text element is taken from Scene, not from `elements` Array.
        // And after `perform` call, all Scene elements overwrithe all Scene elements,
        // even if it was just mutated above, as in our case.
        elements = changeElementProperty(elements, textElement!, textElement!)

        //-------------------------------------//
      } else if (!name && camera.nameRepr) {
        //
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
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target)}
      />
    )
  },
})
