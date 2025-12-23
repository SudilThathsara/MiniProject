import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <AdminProvider>
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
        <Provider store={store}>
            <App />
        </Provider>  
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  </AdminProvider>
)