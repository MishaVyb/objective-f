import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import ObjectivePlusApp from './components/app'
import { store } from './store/store'

// !!! order matters
import '@radix-ui/themes/styles.css'

import './scss/app.scss' // objective-plus
import './../objective/scss/app.scss'
import './../objective/scss/radix.scss'
// app.scss Excalidraw styles imported at packages/excalidraw/index.tsx

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
