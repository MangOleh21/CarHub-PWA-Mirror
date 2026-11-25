import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppStartup from './components/AppStartup.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppStartup />
  </StrictMode>,
)
