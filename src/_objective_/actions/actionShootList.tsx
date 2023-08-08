import { changeProperty, getFormValue } from '../../actions/actionProperties'
import { ButtonIconSelect } from '../../components/ButtonIconSelect'
import { getNonDeletedElements } from '../../element'
import { newElementWith } from '../../element/mutateElement'
import { t } from '../../i18n'
import { getSelectedElements } from '../../scene'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement, isObjective } from '../types/types'
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
    if (!isAllElementsCameras(getSelectedElements(elements, appState))) return <></>
    const isShot = getFormValue(elements, appState, (element) => element.customData?.isShot, null)

    if (!isShot)
      return (
        <fieldset>
          <legend>{t('labels.shotList', null, 'Shot list')}</legend>
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

    return (
      <>
        <fieldset>
          <legend>{t('labels.shotList', null, 'Shot list')}</legend>
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
      shotVersion: undefined,
    }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined,
  }
}

export const representationMeta = register({
  name: 'representationMeta',
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements,
      appState,
      commitToHistory: false,
    }
  },
  // eslint-disable-next-line react/prop-types
  PanelComponent: ({ elements, appState, updateData, appProps }) => {
    const metaKind = getFormValue(
      elements,
      appState,
      (element) => isObjective(element) && element.customData.kind,
      null
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
      <h2>
        {metaKind && t('labels.metaKind', null, metaKind)}
        {shotNumber && ` ${shotNumber}`}
        {shotVersion && ` (${shotVersion})`}
      </h2>
    )
  },
})
