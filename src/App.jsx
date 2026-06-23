import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import NewsPage from './pages/NewsPage'
import AlertsPage from './pages/AlertsPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="bg-[#0A0F14]" style={{ width: 390, height: 844, margin: '0 auto', overflow: 'hidden' }}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'news' && <NewsPage onNavigate={setPage} />}
      {page === 'chat' && <ChatPage onNavigate={setPage} />}
      {page === 'alerts' && <AlertsPage onNavigate={setPage} />}
    </div>
  )
}
