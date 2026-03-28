import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n.js'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store/index.js'


createRoot(document.getElementById('root')).render(
 <Provider store={store}>    
    <App />
  </Provider>

)
