import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import ObjectivePlusApp from './components/app'
import { store } from './store/store'

// !!! order matters
import '@radix-ui/themes/styles.css'

import './scss/app.scss' // objective-plus
import './../objective/scss/app.scss'
// app.scss Excalidraw styles imported at packages/excalidraw/index.tsx

// LEGACY
import './../objective/scss/actionStoryboard.scss'
import './../objective/scss/cameraItem.scss'
import './../objective/scss/popover.scss'
import './../objective/scss/Button.scss'

// TMP
import './scss/debug.scss'

const ObjectivePlusAppIndex = () => {
  return (
    <Provider store={store}>
      <Router>
        <ObjectivePlusApp />
      </Router>
    </Provider>
  )
}

export default ObjectivePlusAppIndex
