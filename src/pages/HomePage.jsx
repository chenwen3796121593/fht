import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import MarketBar, { useMarketQuotes } from '../components/MarketBar'
import { Activity } from 'lucide-react'

function Thermometer({ pct }) {
  const h = Math.max(5, Math.min(100, 50 + pct * 20))
  const color = pct > 0 ? '#EF4444' : pct < 0 ? '#22C55E' : '#F97316'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px]" style={{ color }}>❄️</span>
      <div className="flex-1 h-1.5 bg-[#1A2129] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: h + '%', backgroundColor: color }} />
      </div>
      <span className="text-[10px]" style={{ color }}>🔥</span>
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const quotes = useMarketQuotes()
  const [breadth, setBreadth] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchBreadth = async () => {
      try {
        const res = await fetch('/api/breadth')
        const data = await res.json()
        if (!cancelled && data.total > 0) setBreadth(data)
      } catch(e) {}
    }
    fetchBreadth()
    const t = setInterval(fetchBreadth, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const sh = quotes['sh000001'], sz = quotes['sz399001']
  const totalTurnover = (sh?.turnover && sz?.turnover)
    ? ((sh.turnover + sz.turnover) / 1e8).toFixed(0) + '亿'
    : '--'
  const avgChg = sh && sz ? ((sh.change || 0) + (sz.change || 0)) / 2 : 0

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="home" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onChat={() => onNavigate('chat')} onNews={() => onNavigate('news')} onAlerts={() => onNavigate('alerts')} />

      <div className="px-4 py-3 flex flex-col gap-3">
        <MarketBar quotes={quotes} />

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-3">
            <div className="text-[10px] text-[#6B7280] mb-1">两市成交额</div>
            <div className="text-base font-bold text-[#F0F2F5]">{totalTurnover}</div>
          </div>
          <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-3">
            <div className="text-[10px] text-[#6B7280] mb-1">市场温度</div>
            <div className="text-base font-bold" style={{ color: avgChg > 0.3 ? '#EF4444' : avgChg < -0.3 ? '#22C55E' : '#F97316' }}>
              {avgChg > 0.5 ? '火热' : avgChg > 0.1 ? '偏暖' : avgChg > -0.1 ? '中性' : avgChg > -0.5 ? '偏冷' : '冰点'}
            </div>
            <Thermometer pct={avgChg} />
          </div>
        </div>

        <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4">
          <div className="text-xs text-[#8D949E] mb-3 flex items-center gap-1.5"><Activity size={14} /> 市场涨跌</div>
          {breadth ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between"><span className="text-xs text-[#8D949E]">上涨家数</span><span className="text-sm font-bold text-[#EF4444]">{breadth.up}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-[#8D949E]">下跌家数</span><span className="text-sm font-bold text-[#22C55E]">{breadth.down}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-[#8D949E]">涨停家数</span><span className="text-sm font-bold text-[#EF4444]">{breadth.limUp}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-[#8D949E]">跌停家数</span><span className="text-sm font-bold text-[#22C55E]">{breadth.limDown}</span></div>
            </div>
          ) : (
            <div className="text-xs text-[#4D545C]">加载中...</div>
          )}
        </div>
      </div>
    </div>
  )
}
