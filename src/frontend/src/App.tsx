import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { Page } from './types'
import { LoginPage } from './pages/LoginPage'
import { AppHeader } from './components/layout/AppHeader'

// Green IT (Inspección 04): solo el acceso viaja en el bundle inicial; cada pantalla
// autenticada se descarga bajo demanda la primera vez que se abre.
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const VehiclesPage = lazy(() => import('./pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })))
const DriversPage = lazy(() => import('./pages/DriversPage').then(m => ({ default: m.DriversPage })))
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })))

export function App() {
  const [token, setToken] = useState('')
  const [page, setPage] = useState<Page>('Inicio')
  const previousToken = useRef('')
  useEffect(() => {
    if (token || previousToken.current) document.getElementById('main-content')?.focus({ preventScroll: true })
    previousToken.current = token
  }, [token, page])
  function navigate(target: Page) {
    setPage(target)
    window.scrollTo(0, 0)
    if (target === page) document.getElementById('main-content')?.focus({ preventScroll: true })
  }
  if (!token) return <LoginPage onLogin={value => { setToken(value); window.scrollTo(0, 0) }} />
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <AppHeader page={page} navigate={navigate} onLogout={() => {setToken(''); setPage('Inicio')}} />
    <main key={page} id="main-content" aria-label={page} tabIndex={-1} className="content">
      <Suspense fallback={<p className="loading" role="status">Cargando…</p>}>
      {page === 'Inicio' && <HomePage onNavigate={navigate} />}
      {page === 'Vehículos' && <VehiclesPage token={token} />}
      {page === 'Pedidos' && <OrdersPage token={token} />}
      {page === 'Conductores' && <DriversPage token={token} />}
      {page === 'Clientes' && <ClientsPage token={token} />}
      </Suspense>
    </main>
  </div>
}
