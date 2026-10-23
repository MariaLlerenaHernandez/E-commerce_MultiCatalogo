import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Registrar Service Worker PWA con auto-actualización inmediata
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de MultiCatálogo disponible. Actualizando PWA...')
    updateSW(true)
  },
  onOfflineReady() {
    console.log('MultiCatálogo PWA lista para uso offline')
  },
})

// Verificar actualizaciones cada vez que la ventana toma el foco o recupera conexión
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update()
      })
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
