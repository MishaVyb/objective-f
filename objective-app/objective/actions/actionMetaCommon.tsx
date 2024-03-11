import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { KEYS } from '../../../packages/excalidraw/keys'
import { arrayToMap, focusNearestParent } from '../../../packages/excalidraw/utils'
import { TextField } from '../UI/TextField'
import {
  META_REPR_CONTAINER_INITIAL,
  newMetaReprElement,
  newPointerBeetween,
} from '../elements/newElement'
import {
  getMetaSimple,
  getObjectiveBasis,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getPointerIds,
  getPointers,
  getSelectedElements,
} from '../meta/selectors'

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
import { EyeClosedIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { getBoundTextElement } from '../../../packages/excalidraw/element/textElement'
import { mutateElement } from '../../../packages/excalidraw'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawRectangleElement,
} from '../../../packages/excalidraw/element/types'
import { useState } from 'react'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'
import { handleMetaRepresentation } from '../elements/metaRepr'
import { mutateElementsMeta } from '../elements/mutateElements'

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
            // CALL RECURSIVELY
            elements = actionChangeMetaName.perform(
              elements,
              appState,
              {
                newTextValue: meta.name,
                type: 'updateValue',
              },
              app
            ).elements
          return
        }

        const container = elsMap.get(meta.nameRepr) as ExcalidrawRectangleElement | undefined
        if (!container) {
          if (meta.name && action.type === 'showRepr')
            // extra case: create (no container but should be, maybe user has deleted it by hemself)
            // CALL RECURSIVELY
            elements = actionChangeMetaName.perform(
              elements,
              appState,
              {
                newTextValue: meta.name,
                type: 'updateValue',
              },
              app
            ).elements
          return
        }

        mutateElement(container, {
          opacity: action.type === 'showRepr' ? META_REPR_CONTAINER_INITIAL.opacity : 0,
        })

        const basis = getObjectiveBasis<ExcalidrawBindableElement>(meta)
        getPointers(elsMap, container, basis).map((pointer) =>
          mutateElement(pointer, {
            opacity: action.type === 'showRepr' ? META_REPR_CONTAINER_INITIAL.opacity : 0,
          })
        )

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
        if (!meta.nameRepr) return false
        const container = elsMap.get(meta.nameRepr)
        if (!container) return false

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
    const showEyeButton = true // TODO handle depending on !!singleMeta.name

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

    return (
      <div>
        <legend>{'Properties'}</legend>
        <Dialog.Root onOpenChange={(open) => !open && updateData(textValue)}>
          <Dialog.Trigger>
            <Button variant={'soft'} color={'gray'}>
              <Pencil1Icon />
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

export const actionCreatePointer = register({
  name: 'actionCreatePointer',
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    const [a, b] = value
    const pointer = newPointerBeetween(a, b, app.scene.getNonDeletedElementsMap())
    return {
      elements: pointer ? arrangeElements(elements, [pointer]) : elements,
      commitToHistory: true,
    }
  },
})

export const actionDeletePointer = register({
  name: 'actionDeletePointer',
  trackEvent: false,
  perform: (
    elements,
    appState,
    value: [ExcalidrawBindableElement, ExcalidrawBindableElement],
    app
  ) => {
    const [a, b] = value
    const idsToDelete = getPointerIds(a, b)
    if (!idsToDelete.size) return false

    const elsMap = arrayToMap(elements)
    const pointersToDelete = [...idsToDelete].map((id) => elsMap.get(id)!)

    pointersToDelete.forEach((pointer) => mutateElement(pointer, { isDeleted: true }))

    // pop deleted pointer ids from `element.boundElements`
    fixBindingsAfterDeletion(elements, pointersToDelete)

    // THE SAME AS ABOVE:
    // mutateElement(a, {
    //   boundElements: a.boundElements?.filter((e) => !idsToDelete.has(e.id)),
    // })
    // mutateElement(b, {
    //   boundElements: b.boundElements?.filter((e) => !idsToDelete.has(e.id)),
    // })

    return {
      elements: elements,
      commitToHistory: true,
    }
  },
})
