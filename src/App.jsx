import { AppProvider, useApp } from './context/AppContext.jsx'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import NewsPage from './pages/NewsPage'
import AlertsPage from './pages/AlertsPage'
import IndicatorsPage from './pages/IndicatorsPage'
import VipPage from './pages/VipPage'
import ErrorBoundary from './components/ErrorBoundary'

function PageRouter() {
  const { currentPage } = useApp()

  return (
    <div className="bg-[#0A0F14] mx-auto overflow-hidden max-sm:max-w-[390px] sm:max-w-[480px] w-full h-dvh">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'indicators' && <IndicatorsPage />}
      {currentPage === 'chat' && <ChatPage />}
      {currentPage === 'news' && <NewsPage />}
      {currentPage === 'alerts' && <AlertsPage />}
      {currentPage === 'vip' && <VipPage />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <PageRouter />
      </AppProvider>
    </ErrorBoundary>
  )
}
