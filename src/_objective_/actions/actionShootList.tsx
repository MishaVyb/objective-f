
import { changeProperty, getFormValue } from '../../actions/actionProperties'

import { ButtonIconSelect } from '../../components/ButtonIconSelect'
import { newElementWith } from '../../element/mutateElement'
import { t } from '../../i18n'
import { isCameraElement } from '../types/types'
import { register } from './register'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, value) => {
    const isShot = value
    return {
      ...{
        elements: changeProperty(elements, appState, (el) =>
          newElementWith(el, {
            customData: { ...el.customData, isShot },
          })
        ),
      },
      appState: {
        ...appState,
        ...value,
      },
      commitToHistory: true,
    }
  },
  // eslint-disable-next-line react/prop-types
  PanelComponent: ({ elements, appState, updateData, appProps }) => {
    const isShot = getFormValue(elements, appState, (element) => element.customData?.isShot, null)

    if (!isShot)
      return (
        <fieldset>
          <legend>{t('labels.camera', null, 'Camera')}</legend>
          <ButtonIconSelect
            group='stroke-width'
            options={[
              {
                value: 1,
                text: t('labels.cameraAddToShotlist', null, 'Add to shotlist'),
                icon: <>➕</>,
              },
            ]}
            value={0}
            onChange={(value) => updateData(value)}
          />
        </fieldset>
      )

    const shotNumber = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotNumber,
      null
    )
    const shotVersion = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotVersion,
      null
    )

    return (
      <>
        <h2>
          {t('labels.cam', null, 'Cam')}
          {shotNumber}
          {'-'}
          {shotVersion}
        </h2>
        <fieldset>
          {/* <legend>{t("labels.camera", null, "Camera")}</legend> */}
          <ButtonIconSelect
            group='stroke-width'
            options={[
              {
                value: 0,
                text: t('labels.cameraRemoveFromShotlist', null, 'Remove from shotlist'),
                icon: <>➖</>,
              },
            ]}
            value={1}
            onChange={(value) => updateData(value)}
          />
        </fieldset>
      </>
    )
  },
})
