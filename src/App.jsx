import { useState, Suspense, lazy, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import HomePage from './pages/HomePage'
import NewsPage from './pages/NewsPage'
import AlertsPage from './pages/AlertsPage'
import CommoditiesPage from './pages/CommoditiesPage'
import ErrorBoundary from './components/ErrorBoundary'
import IncomingCall from './components/IncomingCall'
import VideoRoom from './components/VideoRoom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ChatPage = lazy(() => import('./pages/ChatPage'))

function usePreload() {
  useEffect(() => {
    const preload = () => { import('./pages/Dashboard'); import('./pages/ChatPage');  }
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
      {currentPage === 'news' && <NewsPage />}
      {currentPage === 'chat' && <Suspense fallback={<Loading />}><ChatPage /></Suspense>}
      {currentPage === 'alerts' && <AlertsPage />}
      {currentPage === 'commodities' && <CommoditiesPage />}
    </div>
  )
}

function Preloader() { usePreload(); return null }

function CallManager() {
  const { incomingCall, dismissIncoming } = useApp()
  const [callRoom, setCallRoom] = useState(() => {
    // Auto-join room from push notification URL
    const p = new URLSearchParams(window.location.search)
    return p.get('room') || null
  })
  const nick = (() => { try { return localStorage.getItem('fh_nick') || '' } catch { return '' } })()

  const accept = (rid) => { setCallRoom(rid); dismissIncoming() }
  const decline = () => dismissIncoming()

  return (
    <>
      {incomingCall && <IncomingCall from={incomingCall.from} onAccept={() => accept(incomingCall.roomId)} onDecline={decline} />}
      {callRoom && <VideoRoom roomId={callRoom} nick={nick} onClose={() => setCallRoom(null)} />}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <CallManager />
        <Preloader />
        <PageRouter />
      </AppProvider>
    </ErrorBoundary>
  )
}
