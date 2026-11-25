import { useLayoutEffect } from 'react'
import App from '../App.jsx'
import ThemeProvider from '../contexts/ThemeProvider.jsx'

export default function AppStartup() {
  useLayoutEffect(() => {
    document.getElementById('startup-splash')?.remove()
  }, [])

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}
