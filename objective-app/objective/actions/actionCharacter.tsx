import { EnterIcon, ExitIcon } from '@radix-ui/react-icons'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { getObjectiveSingleMeta, getSelectedSceneEls } from '../meta/selectors'

import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { Button, Flex } from '@radix-ui/themes'
import { handleMetaRepresentation } from '../elements/metaRepr'
import { duplicateElements } from '../../../packages/excalidraw/actions/actionDuplicateSelection'
import { ObjectiveKinds, isKind } from '../meta/types'

type TChangeVersionActionValue = 'moveTo' | 'moveFrom'

export const actionMoveCharacterToFrom = register({
  name: 'actionMoveCharacterToFrom',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    const character = getObjectiveSingleMeta(getSelectedSceneEls(app.scene, appState))
    if (!character || !isKind(character, ObjectiveKinds.CHARACTER)) return false

    let newEls: ReturnType<typeof handleMetaRepresentation> = []

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
            </Flex>
          )}
        </Flex>
      </fieldset>
    )
  },
})
