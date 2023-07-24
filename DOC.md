

index.tsx
⬇️
-------------------- excalidraw-app ----------------
## src/excalidraw-app/index.tsx - ExcalidrawApp
    - оборачивает в еще один провайдер appJotaiStore
⬇️
## src/excalidraw-app/index.tsx - ExcalidrawWrapper
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
    - рендерит весь UI, в тч контекст меню и тоаст
    - рендерит канвас