import { EnterIcon, ExitIcon, ReloadIcon } from '@radix-ui/react-icons'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { getObjectiveSingleMeta, getSelectedSceneEls } from '../meta/_selectors'

import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { Button, Flex } from '@radix-ui/themes'
import { handleMetaRepresentation } from '../elements/_metaRepr'
import { duplicateElements } from '../../../packages/excalidraw/actions/actionDuplicateSelection'
import { ObjectiveKinds, isKind } from '../meta/_types'
import { degreesToRadian, ensureVector, getElementCenter } from '../elements/_math'
import { getObjectiveRotationCenter } from '../elements/_resizeElements'
import { mutateElement } from '../../../packages/excalidraw'

type TChangeVersionActionValue = 'moveTo' | 'moveFrom' | 'rotateTo'

export const actionMoveCharacterToFrom = register({
  name: 'actionMoveCharacterToFrom',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    let newEls: ReturnType<typeof handleMetaRepresentation> = []
    const character = getObjectiveSingleMeta(getSelectedSceneEls(app.scene, appState))
    if (!character || !isKind(character, ObjectiveKinds.CHARACTER)) return false

    const basisCenter = getElementCenter(character.basis!)

    switch (actionType) {
      case 'moveTo':
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: 150, y: 0 },
            addPointerWith: character,
            addPointerSubkind: 'characterMovementPointer',
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
          }),
          commitToHistory: true,
        }
      case 'rotateTo':
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
        res.extra.newEls.forEach((e) => mutateElement(e, { backgroundColor: 'transparent' }))
        res.extra.extraNewEls.forEach((e) => mutateElement(e, { backgroundColor: 'transparent' }))
        return {
          elements: res.elements,
          appState: res.appState,
          commitToHistory: true,
        }
    }

    return {
      elements: [...elements, ...newEls],
      commitToHistory: true,
    }
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
              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveFrom')}
                title={'Move character from'}
              >
                {'From'}
                <EnterIcon />
              </Button>

              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveTo')}
                title={'Move character to'}
              >
                <ExitIcon />
                {'To'}
              </Button>

              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('rotateTo')}
                title={'Add turn'}
              >
                <ReloadIcon />
                {'Turn'}
              </Button>
            </Flex>
          )}
        </Flex>
      </fieldset>
    )
  },
})
