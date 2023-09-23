

index.tsx
⬇️
-------------------- excalidraw-app ----------------
## src/excalidraw-app/index.tsx - ExcalidrawApp
    - оборачивает в еще один провайдер appJotaiStore
⬇️
## src/excalidraw-app/index.tsx - ExcalidrawWrapper
Все взаимодействие с Excalidraw, как с отдельной сущностью из отдельного пакета,
реализовано в этом компоненте. Все, что описано в документации, как можно дополнять и кастомизировать
дефолтный Excalidraw из пакета, настраивается именно в этом месте.
    - передает все `childred`, это AppMainMenu, AppFooter, AppWelcomeScreen, Sidebar и тд
    // NOTE: children инициализируется здесь, но рендерится внутри компонента App
    // Это значит, что во всех детях доступных все хуки и инструменты из компоненты App)
    // NOTE:
    // excalidrawAPI.getSceneElements do not trigger re-render of components where it's used **automatically**
    // So you have to update local `ExcalidrawWrapper` state on every scene change and use this state to access attributes.
    // To avoid `Maximum update depth exceeded` use DeepEqual check `lodash.isEqual`.
    //

    - настраивает UIOptions
    - реализует работу с CollabAPI
    - реализует работу с LocalData (сохраняет все в local storage)
    - взаимодействует с `excalidrawAPI, excalidrawRefCallback`


---------------------- package --------------------
⬇️
## src/packages/excalidraw/index.tsx - forwardedRefComp
    - React.memo функции areEqual, чтобы проверять разные пропсы пришли или нет (нужно ли ре-рендерить)
⬇️
## src/packages/excalidraw/index.tsx - ExcalidrawBase
    - оборачивает App в провайдер Jotai Store
    - инициализирует App язык и тему


---------------------- component --------------------
⬇️
## src/components/App.tsx - App
    - содержит все контекст провайдеры
    - рендерит весь UI, в тч контекст меню и тосты
    - рендерит канвас
    - наполняет excalidrawAPI, тем самым все состояния компонента App может быть доступно выше ⬆️
    excalidrawAPI: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/ref


------------------------

App.scene = new Scene
App.actionManager = new ActionManager
    actionManager.getElementsIncludingDelited <-- app.scene.getElementsIncludingDelited

ActionManager.renderAction(..) --> `<PanelComponent>`
    - perform `actionFunction` --> `actionResult`
        > When any `action`/`<PanelComponent>` fires update,
        > `actionFunction` called with `app.scene.getElementsIncludingDelited`

    - then `actionResult` are passed to App.withBatchedUpdates
        - where `scene.replaceAllElements` are called (the same app.scene!!!)

So..
    - Can we mutate this elements. As it was recreated once - for shore
    - Can we access this elements by id or other custom fileters directly from scene. Yep


LEGACY:
for single provided element:
    newElementWith (original) / newMetaWith (VBRN)

all selected elements:
    changeProperty (original) / changeElementsMeta (VBRN)

target element:
    ...                       / changeElementProperty (VBRN)

NEW:
for single provided element:
    mutateElement (original) / mutateElementMeta (VBRN)

all selected elements:
  ...                        / mutateElementsMeta (VBRN)

target element:
    ...                      / mutateElement
