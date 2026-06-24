import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import MarketBar, { useMarketQuotes } from '../components/MarketBar'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'

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

function SectorFlow() {
  const [tab, setTab] = useState('in')
  const [allData, setAllData] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        // Try CF format first (single request)
        const res = await fetch('/api/flow?t=' + Date.now())
        const json = await res.json()
        if (!cancelled) {
          // CF format: {data: [...], outData: [...]}
          if (json.data && json.outData) { setAllData(json); return }
          // Local proxy format: {data: {diff: [...]}}
          if (json.data?.diff) {
            // Fetch both directions
            const outRes = await fetch('/api/flow?type=out')
            const outJson = await outRes.json()
            const mapData = (arr) => (arr?.data?.diff || []).map(i => ({
              name: i.f14 || '?', netFlow: parseFloat(i.f62) || 0,
              change: parseFloat(i.f3) || 0, netRatio: parseFloat(i.f184) || 0,
            }))
            if (!cancelled) setAllData({ data: mapData(json), outData: mapData(outJson) })
          }
        }
      } catch(e) { if (!cancelled) setAllData(null) }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const data = tab === 'in' ? allData?.data : allData?.outData
  const maxFlow = data?.length ? Math.max(...data.map(d => Math.abs(d.netFlow))) : 1

  return (
    <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[#8D949E] flex items-center gap-1.5">
          <TrendingUp size={14} className={tab === 'in' ? 'text-[#EF4444]' : 'text-[#8D949E]'} />
          板块资金
        </div>
        <div className="flex gap-1">
          <button onClick={() => setTab('in')} className={`px-2.5 py-1 rounded text-[11px] font-medium ${tab === 'in' ? 'bg-[#EF4444] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>流入 TOP</button>
          <button onClick={() => setTab('out')} className={`px-2.5 py-1 rounded text-[11px] font-medium ${tab === 'out' ? 'bg-[#22C55E] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>流出 TOP</button>
        </div>
      </div>
      {data && data.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {data.map((item, i) => {
            const name = item.name || '?'
            const flow = (item.netFlow || 0) / 1e8
            const barW = Math.max(3, Math.abs(flow) / (maxFlow / 1e8) * 100)
            const up = flow > 0
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-[#8D949E] truncate" title={name}>{name}</span>
                <div className="flex-1 h-3 bg-[#1A2129] rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm" style={{ width: barW + '%', backgroundColor: up ? '#EF4444' : '#22C55E' }} />
                </div>
                <span className="w-16 text-right font-medium" style={{ color: up ? '#EF4444' : '#22C55E' }}>
                  {up ? '+' : ''}{flow.toFixed(1)}亿
                </span>
                <span className="w-12 text-right" style={{ color: (item.change||0) >= 0 ? '#EF4444' : '#22C55E' }}>
                  {(item.change||0) >= 0 ? '+' : ''}{(item.change||0).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-xs text-[#4D545C] py-4 text-center">加载中...</div>
      )}
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const quotes = useMarketQuotes()
  const [breadth, setBreadth] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchBreadth = async () => {
      try { const res = await fetch('/api/breadth?t=' + Date.now()); const data = await res.json(); if (!cancelled && data.total > 0) setBreadth(data) } catch(e) {}
    }
    fetchBreadth()
    const t = setInterval(fetchBreadth, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const sh = quotes['sh000001'], sz = quotes['sz399001']
  const totalTurnover = (sh?.turnover && sz?.turnover) ? ((sh.turnover + sz.turnover) / 1e8).toFixed(0) + '亿' : '--'
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

        <SectorFlow />
      </div>
    </div>
  )
}
