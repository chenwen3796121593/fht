import { useState, useEffect } from 'react'
import { Flame, House, TrendingUp, MessageCircle, Zap, CircleDollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const ICON_SZ = 17
const PAGES = ['home', 'dashboard', 'chat', 'alerts', 'commodities']
const ICONS = { home: House, dashboard: TrendingUp, chat: MessageCircle, alerts: Zap, commodities: CircleDollarSign }
const LABELS = { home: '主页', dashboard: '自选', chat: '聊天', alerts: '分析', commodities: '大宗' }

function useClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function hasMentionBadge() {
  try { return parseInt(localStorage.getItem('fh_mention_badge') || '0') > 0 } catch { return false }
}

export default function TopBar({ active, sidebar }) {
  const { navigate } = useApp()
  const mentionBadge = hasMentionBadge()
  const clock = useClock()

  // 侧边栏模式（平板/电脑）
  if (sidebar) {
    return (
      <div className="flex flex-col items-center gap-2 py-5 px-2 bg-[var(--bg-elev)] border-r border-[var(--border)] h-full">
        <div className="flex flex-col items-center mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--gold-soft)] border border-[rgba(232,176,75,0.25)]">
            <Flame size={22} className="text-[var(--gold)]" />
          </div>
          <span className="text-[11px] font-bold text-[var(--gold)] mt-1.5 tracking-wide">烽火台</span>
          <span className="text-[9px] font-mono text-[var(--text-2)] mt-0.5 num" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>
        <div className="w-8 divider mb-1" />
        <div className="flex flex-col items-center gap-1.5 w-full">
          {PAGES.map(page => {
            const Icon = ICONS[page]
            const isActive = active === page
            return (
              <button key={page} onClick={() => navigate(page)}
                className={`relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] w-full transition-all ${isActive ? 'bg-[var(--gold-soft)] text-[var(--gold)] shadow-[inset_0_0_0_1px_rgba(232,176,75,0.28)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-r before:bg-[var(--gold)]' : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'}`}>
                <Icon size={20} />
                <span className="font-medium">{LABELS[page]}</span>
                {page === 'chat' && mentionBadge && <span className={`absolute top-1.5 right-2.5 w-2 h-2 rounded-full ${isActive ? 'bg-[#0A0C10]' : 'bg-[var(--down)]'}`} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 顶栏模式（手机）- md 以上隐藏（iPad/电脑走侧边栏）
  return (
    <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 sticky top-0 bg-[var(--bg)]/90 backdrop-blur-xl z-30 md:hidden border-b border-[var(--border-soft)] shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--gold-soft)] border border-[rgba(232,176,75,0.25)]">
          <Flame size={17} className="text-[var(--gold)]" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold text-[var(--gold)]">烽火台</span>
          <span className="text-[10px] font-mono text-[var(--text-2)] num mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {PAGES.map(page => {
          const Icon = ICONS[page]
          const isActive = active === page
          return (
            <button key={page} onClick={() => navigate(page)}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all shrink-0 ${isActive ? 'bg-[var(--gold)] text-[#0A0C10]' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}>
              <Icon size={13} />
              <span>{LABELS[page]}</span>
              {page === 'chat' && mentionBadge && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg)] ${isActive ? 'bg-[#0A0C10]' : 'bg-[var(--down)]'}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
