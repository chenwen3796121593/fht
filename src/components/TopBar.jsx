import { useState, useEffect } from 'react'
import { Flame, House, TrendingUp, MessageCircle, Bell, Newspaper, Zap, CircleDollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const ICON_SZ = 17
const PAGES = ['home', 'dashboard', 'news', 'chat', 'alerts', 'commodities']
const ICONS = { home: House, dashboard: TrendingUp, news: Newspaper, chat: MessageCircle, alerts: Zap, commodities: CircleDollarSign }
const LABELS = { home: '主页', dashboard: '自选', news: '新闻', chat: '聊天', alerts: '分析', commodities: '大宗' }

function useClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function hasActiveAlerts() {
  try { return JSON.parse(localStorage.getItem('fh_alerts') || '[]').some(a => a.active) } catch { return false }
}
function hasMentionBadge() {
  try { return parseInt(localStorage.getItem('fh_mention_badge') || '0') > 0 } catch { return false }
}

export default function TopBar({ active, sidebar }) {
  const { navigate } = useApp()
  const showBadge = hasActiveAlerts()
  const mentionBadge = hasMentionBadge()
  const clock = useClock()

  // 侧边栏模式（平板/电脑）
  if (sidebar) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-2 bg-[#0A0F14] border-r border-[#242B33] h-full">
        <div className="flex flex-col items-center mb-2">
          <Flame size={24} className="text-orange-400" />
          <span className="text-[10px] font-bold text-orange-400 mt-0.5">烽火台</span>
          <span className="text-[10px] font-mono text-[#F0F2F5] mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>
        {PAGES.map(page => {
          const Icon = ICONS[page]
          const isActive = active === page
          return (
            <button key={page} onClick={() => navigate(page)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-[10px] relative transition-colors w-full ${isActive ? 'bg-[#3B82F6] text-white' : 'text-[#8D949E] hover:text-[#F0F2F5] hover:bg-[#1A2129]'}`}>
              <Icon size={20} />
              <span>{LABELS[page]}</span>
              {page === 'alerts' && showBadge && <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />}
              {page === 'chat' && mentionBadge && <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-[#22C55E] rounded-full" />}
            </button>
          )
        })}
      </div>
    )
  }

  // 顶栏模式（手机）- lg 以上隐藏
  return (
    <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 sticky top-0 bg-[#0A0F14] z-10 lg:hidden">
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Flame size={22} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-400 leading-none">烽火台</span>
        </div>
        <span className="text-xs font-mono tracking-widest text-[#F0F2F5] leading-none mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
      </div>
      <div className="flex-1" />
      {PAGES.map(page => {
        const Icon = ICONS[page]
        const isActive = active === page
        return (
          <button key={page} onClick={() => navigate(page)}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg text-[9px] relative transition-colors ${isActive ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]'}`}>
            <Icon size={ICON_SZ} />
            <span className="text-[8px] leading-none">{LABELS[page]}</span>
            {page === 'alerts' && showBadge && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />}
            {page === 'chat' && mentionBadge && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#22C55E] rounded-full" />}
          </button>
        )
      })}
    </div>
  )
}
