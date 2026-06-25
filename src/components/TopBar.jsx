import { Flame, House, TrendingUp, BarChart3, MessageCircle, Bell, Newspaper, Crown } from 'lucide-react'

const ICON_SZ = 17

function hasActiveAlerts() {
  try { return JSON.parse(localStorage.getItem('fh_alerts') || '[]').some(a => a.active) } catch { return false }
}

export default function TopBar({ onNews, onAlerts, onChat, onStocks, onIndicators, onHome, onVip = () => {}, active }) {
  const showBadge = hasActiveAlerts()

  const btn = (Icon, handler, isActive) => (
    <button onClick={handler} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]'}`}>
      <Icon size={ICON_SZ} />
    </button>
  )

  return (
    <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 sticky top-0 bg-[#0A0F14] z-10">
      <div className="flex items-center gap-1 h-8">
        <Flame size={26} className="text-orange-400" />
        <span className="text-lg font-bold text-[#F0F2F5] leading-none">烽火台</span>
      </div>
      <div className="flex-1" />
      {btn(House, onHome, active === 'home')}
      {btn(TrendingUp, onStocks, active === 'dashboard')}
      {btn(BarChart3, onIndicators, active === 'indicators')}
      {btn(Newspaper, onNews, active === 'news')}
      {btn(MessageCircle, onChat, active === 'chat')}
      <button onClick={onAlerts} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm relative transition-colors ${active === 'alerts' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]'}`}>
        <Bell size={ICON_SZ} />
        {showBadge && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />}
      </button>
      {btn(Crown, onVip, active === 'vip')}
    </div>
  )
}
