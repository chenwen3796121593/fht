import { Suspense, lazy, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import HomePage from './pages/HomePage'
import NewsPage from './pages/NewsPage'
import AlertsPage from './pages/AlertsPage'
import MetalsPage from './pages/MetalsPage'
import ErrorBoundary from './components/ErrorBoundary'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const IndicatorsPage = lazy(() => import('./pages/IndicatorsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const VipPage = lazy(() => import('./pages/VipPage'))

// Preload heavy chunks in background after page becomes idle
function usePreload() {
  useEffect(() => {
    const preload = () => {
      import('./pages/Dashboard')
      import('./pages/IndicatorsPage')
      import('./pages/ChatPage')
      import('./pages/VipPage')
    }
    const idle = 'requestIdleCallback' in window ? requestIdleCallback : setTimeout
    const id = idle(preload, { timeout: 3000 })
    return () => { 'cancelIdleCallback' in window ? cancelIdleCallback(id) : clearTimeout(id) }
  }, [])
}

function Loading() {
  return <div className="bg-[#0A0F14] h-full flex items-center justify-center"><span className="text-sm text-[#4D545C]">加载中...</span></div>
}

function PageRouter() {
  const { currentPage } = useApp()

  return (
    <div className="bg-[#0A0F14] mx-auto overflow-hidden max-sm:max-w-[390px] sm:max-w-[480px] w-full h-dvh">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'dashboard' && <Suspense fallback={<Loading />}><Dashboard /></Suspense>}
      {currentPage === 'indicators' && <Suspense fallback={<Loading />}><IndicatorsPage /></Suspense>}
      {currentPage === 'news' && <NewsPage />}
      {currentPage === 'chat' && <Suspense fallback={<Loading />}><ChatPage /></Suspense>}
      {currentPage === 'alerts' && <AlertsPage />}
      {currentPage === 'metals' && <MetalsPage />}
      {currentPage === 'vip' && <Suspense fallback={<Loading />}><VipPage /></Suspense>}
    </div>
  )
}

function Preloader() { usePreload(); return null }

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Preloader />
        <PageRouter />
      </AppProvider>
    </ErrorBoundary>
  )
}
