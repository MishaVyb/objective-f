import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { KEYS } from '../../../packages/excalidraw/keys'
import { focusNearestParent } from '../../../packages/excalidraw/utils'
import { TextField } from '../UI/TextField'
import { META_REPR_CONTAINER_INITIAL, newMetaReprElement } from '../elements/newElement'
import {
  getMetaSimple,
  getObjectiveBasis,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getSelectedElements,
} from '../meta/selectors'
import { handleMetaRepresentation, mutateElementsMeta } from '../elements/helpers'
import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import {
  ObjectiveElement,
  ObjectiveKinds,
  ObjectiveMeta,
  isCameraElement,
  isCameraMeta,
  isDisplayed,
  isObjective,
} from '../meta/types'
import { getCameraMetaReprStr, getCameraVersionStr } from './actionShootList'
import { arrangeElements } from './zindex'
import { Button, Dialog, Flex, Kbd, TextArea } from '@radix-ui/themes'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { getBoundTextElement } from '../../../packages/excalidraw/element/textElement'
import { mutateElement } from '../../../packages/excalidraw'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { useState } from 'react'

export const actionDisplayMetaHeader = register({
  name: 'actionDisplayMetaHeader',
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
    if (!metaKind) return <></> // different metas selected

    if (metaKind === ObjectiveKinds.CHARACTER || metaKind === ObjectiveKinds.LIGHT)
      return (
        <Flex justify={'between'}>
          <Kbd>{metaKind}</Kbd>
        </Flex>
      )

    if (metaKind === ObjectiveKinds.CAMERA) {
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
    }

    // all other Objective kinds
    // NOTE: display name here, as we do not display meta name input
    const name = getFormValue(
      elements,
      appState,
      (element) => isObjective(element) && element.customData.name,
      true,
      null
    )
    return (
      <Flex justify={'between'}>
        <Kbd>{metaKind}</Kbd>
        {name ? <Kbd style={{ minWidth: 30 }}>{name}</Kbd> : null}
      </Flex>
    )
  },
})

export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (
    elements,
    appState,
    action: { newTextValue: string; type: 'updateValue' | 'hideRepr' | 'showRepr' },
    app: AppClassProperties
  ) => {
    const elsMap = app.scene.getElementsMapIncludingDeleted()
    const metas = getObjectiveMetas(getSelectedElements(app.scene, appState))
    let newEls: ExcalidrawElement[] = []

    if (action.type === 'showRepr' || action.type === 'hideRepr') {
      // [1] display or hide

      metas.forEach((meta) => {
        if (!meta.nameRepr) {
          if (meta.name && action.type === 'showRepr')
            // extra case: create
            return actionChangeMetaName.perform(
              elements,
              appState,
              {
                newTextValue: meta.name,
                type: 'updateValue',
              },
              app
            )
          return
        }

        const container = elsMap.get(meta.nameRepr)
        if (!container) {
          if (meta.name && action.type === 'showRepr')
            // extra case: create (no container but should be, maybe user has deleted it by hemself)
            return actionChangeMetaName.perform(
              elements,
              appState,
              {
                newTextValue: meta.name,
                type: 'updateValue',
              },
              app
            )
          return
        }

        mutateElement(container, {
          opacity: action.type === 'showRepr' ? META_REPR_CONTAINER_INITIAL.opacity : 0,
        })
        const text = getBoundTextElement(container, elsMap)
        if (!text) return console.warn('No text container for meta representation. ')

        mutateElement(text, { opacity: action.type === 'showRepr' ? 100 : 0 })
      })
    } else {
      // [2-1] change name in representation
      newEls = handleMetaRepresentation(
        app.scene,
        metas,
        'nameRepr',
        (m: ObjectiveMeta) =>
          isCameraMeta(m)
            ? getCameraMetaReprStr(m, { name: action.newTextValue })
            : action.newTextValue,
        newMetaReprElement
      )

      // [2-2] change name in meta
      mutateElementsMeta(app, { name: action.newTextValue })
    }

    return {
      elements: newEls.length ? arrangeElements(elements, newEls) : elements,
      commitToHistory: true,
    }
  },

  PanelComponent: ({ elements, appState, updateData, app }: PanelComponentProps) => {
    const elsMap = app.scene.getElementsMapIncludingDeleted()

    const name = getFormValue(
      elements,
      appState,
      (element) => element.customData?.name,
      true,
      null // default
    )
    const metaReprIsDisplayed = getFormValue(
      elements,
      appState,
      (element) => {
        const meta = getMetaSimple(element as ObjectiveElement)
        if (!meta.nameRepr) return true
        const container = elsMap.get(meta.nameRepr)
        if (!container) return true

        return isDisplayed(container)
      },
      true,
      null // default
    )

    const singleMeta = getObjectiveSingleMeta(
      app.scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })
    )
    const basis = getObjectiveBasis(singleMeta)
    const bgOpacity = '20' // from `00` up to `FF`
    const bgColor = basis ? basis.backgroundColor + bgOpacity : null
    const showEyeButton = singleMeta ? !!name : true

    return (
      <TextField
        placeholder='Label'
        value={name || ''}
        onChange={(newTextValue) => updateData({ newTextValue, type: 'updateValue' })}
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target as any)}
        bgColor={bgColor}
        slotIcon={showEyeButton ? metaReprIsDisplayed ? <EyeOpenIcon /> : <EyeClosedIcon /> : null}
        onSlotIconClick={() => updateData({ type: metaReprIsDisplayed ? 'hideRepr' : 'showRepr' })}
      />
    )
  },
})

export const actionChangeMetaDescription = register({
  name: 'actionChangeMetaDescription',
  trackEvent: false,
  perform: (elements, appState, newTextValue: string, app: AppClassProperties) => {
    mutateElementsMeta(app, { description: newTextValue })
    return {
      elements: elements,
      commitToHistory: !!newTextValue,
    }
  },

  PanelComponent: ({ elements, appState, updateData, app }: PanelComponentProps) => {
    const singleMeta = getObjectiveSingleMeta(
      app.scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })
    )
    const [textValue, setTextValue] = useState(singleMeta?.description || '')

    if (!singleMeta) return <></>

    console.log(singleMeta.description)
    return (
      <div>
        <legend>{'Properties'}</legend>
        <Dialog.Root onOpenChange={(open) => !open && updateData(textValue)}>
          <Dialog.Trigger>
            <Button variant={'soft'} color={'gray'}>
              {'Description'}
            </Button>
          </Dialog.Trigger>

          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>{app.actionManager.renderAction('actionDisplayMetaHeader')}</Dialog.Title>
            <Dialog.Description size='2' mb='4'>
              {'Edit description'}
            </Dialog.Description>

            {/* <div className='panelColumn'>
              {app.actionManager.renderAction('actionChangeMetaName')}
            </div> */}

            <TextArea
              style={{
                minHeight: 200,
              }}
              placeholder={`${singleMeta.kind} description...`}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(event) =>
                event.key === KEYS.ENTER && focusNearestParent(event.target as any)
              }
            />

            <Flex gap='3' mt='4' justify='end' align={'baseline'}>
              <Dialog.Close>
                {textValue !== singleMeta.description && (
                  <Button
                    variant={'ghost'}
                    color='gray'
                    onClick={(e) => setTextValue(singleMeta.description || '')}
                  >
                    Cancel
                  </Button>
                )}
              </Dialog.Close>
              <Dialog.Close>
                <Button highContrast variant={'soft'} color='gray'>
                  Ok
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    )
  },
})
