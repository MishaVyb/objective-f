import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import ObjectivePlusApp from './components/app'
import { store } from './store/store'

import '@radix-ui/themes/styles.css'

const ObjectivePlusWrapper = () => {
  return (
    <Provider store={store}>
      <Router>
        <ObjectivePlusApp />
      </Router>
    </Provider>
  )
}

export default ObjectivePlusWrapper
