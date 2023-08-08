import { changeProperty, getFormValue } from '../../actions/actionProperties'
import { useExcalidrawElements } from '../../components/App'
import { ButtonIconSelect } from '../../components/ButtonIconSelect'
import { getNonDeletedElements } from '../../element'
import { newElementWith } from '../../element/mutateElement'
import { t } from '../../i18n'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta, isCameraElement } from '../types/types'
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
            customData: {
              ...el.customData,
              ...determineCameraMeta(getCameraMetas(getNonDeletedElements(elements)), isShot),
            },
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
    const cameras = getCameraMetas(useExcalidrawElements())
    const isShot = getFormValue(elements, appState, (element) => element.customData?.isShot, null)

    console.log({ cameras })

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

const determineCameraMeta = (cameras: Readonly<CameraMeta>[], isShot: boolean) => {
  if (isShot)
    return {
      isShot: true,
      shotNumber: Math.max(...cameras.map((c) => c.shotNumber || 0)) + 1,
      shotVersion: Math.max(...cameras.map((c) => c.shotVersion || 0)) + 1,
    }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined,
  }
}
