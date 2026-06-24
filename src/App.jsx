import { useState } from 'react'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import NewsPage from './pages/NewsPage'
import AlertsPage from './pages/AlertsPage'
import IndicatorsPage from './pages/IndicatorsPage'

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <div className="bg-[#0A0F14] mx-auto overflow-hidden" style={{ maxWidth: 390, width: '100%', height: '100dvh' }}>
      {page === 'home' && <HomePage onNavigate={setPage} />}
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'indicators' && <IndicatorsPage onNavigate={setPage} />}
      {page === 'chat' && <ChatPage onNavigate={setPage} />}
      {page === 'news' && <NewsPage onNavigate={setPage} />}
      {page === 'alerts' && <AlertsPage onNavigate={setPage} />}
    </div>
  )
}
