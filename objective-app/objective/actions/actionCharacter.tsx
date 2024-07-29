import { EnterIcon, ExitIcon, ReloadIcon } from '@radix-ui/react-icons'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { getCore, getObjectiveSingleMeta, getSelectedSceneEls } from '../meta/_selectors'

import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { Button, Flex } from '@radix-ui/themes'
import { handleMetaRepresentation } from '../elements/_metaRepr'
import { duplicateElements } from '../../../packages/excalidraw/actions/actionDuplicateSelection'
import { ObjectiveKinds, isKind } from '../meta/_types'
import { degreesToRadian, ensureVector, getElementCenter } from '../elements/_math'
import { getObjectiveRotationCenter } from '../elements/_resizeElements'
import { mutateElement } from '../../../packages/excalidraw'
import { ExcalRadixButton } from './components/button'

type TChangeVersionActionValue = 'moveTo' | 'moveFrom' | 'addTurn'

export const actionCharacterMovement = register({
  name: 'actionCharacterMovement',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    const { oScene } = getCore()
    const character = getObjectiveSingleMeta(getSelectedSceneEls(app.scene, appState))
    if (!character || !isKind(character, ObjectiveKinds.CHARACTER)) return false

    const basisCenter = getElementCenter(character.basis!)
    const parentOrSelf = oScene.getTurnParent(character) || character

    switch (actionType) {
      case 'moveTo':
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: 150, y: 0 },
            addPointerWith: character,
            addPointerSubkind: 'characterMovementPointer',
            newElementsOverrides: {
              backgroundColor: parentOrSelf.basis!.backgroundColor,
            },
            addPointerOverrides: {
              strokeColor: parentOrSelf.basis!.backgroundColor,
            },
          }),
          commitToHistory: true,
        }
      case 'moveFrom':
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: -150, y: 0 },
            addPointerWith: character,
            addPointerSubkind: 'characterMovementPointer',
            addPointerReverseDirection: true,
            newElementsOverrides: {
              backgroundColor: parentOrSelf.basis!.backgroundColor,
            },
            addPointerOverrides: {
              strokeColor: parentOrSelf.basis!.backgroundColor,
            },
          }),
          commitToHistory: true,
        }
      case 'addTurn':
        const res = duplicateElements(elements, appState, app, {
          shift: { x: 0, y: 0 },
          rotate: {
            center: ensureVector(
              getObjectiveRotationCenter(
                character,
                basisCenter.x,
                basisCenter.y, //
                { force: true }
              )
            ),
            angle: character.basis!.angle + degreesToRadian(45),
          },
          newElementsMeta: {
            turnParentId: character.turnParentId || character.id,
            nameRepr: undefined,
          },
        })
        if (!res) return false
        const newMeta = getObjectiveSingleMeta(res.extra.newEls)
        if (newMeta) mutateElement(newMeta.elements[1], { backgroundColor: 'transparent' })
        return {
          elements: res.elements,
          appState: res.appState,
          commitToHistory: true,
        }
    }
    return false
  },

  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
    app,
  }: PanelComponentProps<TChangeVersionActionValue>) => {
    const singleMeta = getObjectiveSingleMeta(getSelectedSceneEls(app.scene, appState))

    return (
      <fieldset>
        <legend>{'Movement'}</legend>
        <Flex direction={'column'} gap={'1'}>
          {singleMeta && (
            <Flex gap={'1'}>
              <ExcalRadixButton
                size={'1'}
                variant={'surface'}
                onClick={() => updateData('moveFrom')}
                title={'Move character from'}
              >
                {'From'}
                <EnterIcon />
              </ExcalRadixButton>

              <ExcalRadixButton
                size={'1'}
                variant={'surface'}
                onClick={() => updateData('moveTo')}
                title={'Move character to'}
              >
                <ExitIcon />
                {'To'}
              </ExcalRadixButton>

              <ExcalRadixButton
                size={'1'}
                variant={'surface'}
                onClick={() => updateData('addTurn')}
                title={'Add turn'}
              >
                <ReloadIcon />
                {'Turn'}
              </ExcalRadixButton>
            </Flex>
          )}
        </Flex>
      </fieldset>
    )
  },
})

export const actionCharacterMoveFrom = register({
  ...actionCharacterMovement,
  name: 'characterMoveFrom',
  contextItemLabel: 'Move from',
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) =>
    actionCharacterMovement.perform(elements, appState, 'moveFrom', app),
})
export const actionCharacterMoveTo = register({
  ...actionCharacterMovement,
  name: 'characterMoveTo',
  contextItemLabel: 'Move to',
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) =>
    actionCharacterMovement.perform(elements, appState, 'moveTo', app),
})
export const actionCharacterAddTurn = register({
  ...actionCharacterMovement,
  name: 'characterAddTurn',
  contextItemLabel: 'Add turn',
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) =>
    actionCharacterMovement.perform(elements, appState, 'addTurn', app),
})
