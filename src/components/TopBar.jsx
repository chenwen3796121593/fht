import { Flame, House, Newspaper, MessageCircle, Bell } from 'lucide-react'

const ICON_SZ = 17

function hasActiveAlerts() {
  try {
    const alerts = JSON.parse(localStorage.getItem('fh_alerts') || '[]')
    return alerts.some(a => a.active)
  } catch { return false }
}

export default function TopBar({ onNews, onAlerts, onChat, onHome, active }) {
  const showBadge = hasActiveAlerts()

  const btn = (Icon, handler, isActive) => (
    <button
      onClick={handler}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        isActive ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]'
      }`}
    >
      <Icon size={ICON_SZ} />
    </button>
  )

  return (
    <div className="flex items-center gap-1.5 px-4 py-3 sticky top-0 bg-[#0A0F14] z-10">
      <Flame size={18} className="text-orange-400" />
      <span className="text-[10px] text-orange-400 font-medium bg-[#1A1F2E] px-1.5 py-0.5 rounded">烽火台</span>
      <span className="text-xs font-semibold text-[#F0F2F5] ml-1">光头Chen</span>
      <div className="flex-1" />
      {btn(House, onHome, active === 'dashboard')}
      {btn(Newspaper, onNews, active === 'news')}
      {btn(MessageCircle, onChat, active === 'chat')}
      <button onClick={onAlerts} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm relative transition-colors ${active === 'alerts' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]'}`}>
        <Bell size={ICON_SZ} />
        {showBadge && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
      </button>
    </div>
  )
}
