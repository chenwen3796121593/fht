import { useState, useEffect, lazy, Suspense } from 'react'
import TopBar from '../components/TopBar'
import MarketBar from '../components/MarketBar'
import { useApp } from '../context/AppContext.jsx'
import { SkeletonMarketCards, SkeletonHomeStats } from '../components/Skeleton.jsx'
import { Activity, TrendingUp, Snowflake, Flame, BarChart3 } from 'lucide-react'

const IndicatorsPanel = lazy(() => import('../components/IndicatorsPanel'))

function Thermometer({ pct, ready }) {
  const color = ready ? (pct > 0 ? '#EF4444' : pct < 0 ? '#22C55E' : '#F97316') : '#4D545C'
  return (
    <div className="flex items-center gap-1.5">
      <Snowflake size={12} style={{ color }} />
      <div className="flex-1 h-1.5 bg-[#1A2129] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: ready ? Math.max(5, Math.min(100, 50 + pct * 20)) + '%' : '50%', backgroundColor: color }} />
      </div>
      <Flame size={12} style={{ color }} />
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
        const res = await fetch('/api/flow')
        const json = await res.json()
        if (!cancelled && json.data && json.outData) setAllData(json)
      } catch(e) { if (!cancelled) setAllData(null) }
    }
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => { cancelled = true; clearInterval(timer) }
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

export default function HomePage() {
  const { quotes, loading, breadth } = useApp()
  const isInitialLoad = loading && Object.keys(quotes).length === 0
  const [subTab, setSubTab] = useState('sentiment')
  const [yesterday, setYesterday] = useState(null)

  const sh = quotes['sh000001'], sz = quotes['sz399001']
  const dataReady = !!(sh && sz)
  const todayAmt = (sh?.turnover && sz?.turnover) ? (sh.turnover + sz.turnover) : 0
  const totalTurnover = todayAmt ? (todayAmt / 1e8).toFixed(0) + '亿' : '--'
  const avgChg = dataReady ? ((sh.change || 0) + (sz.change || 0)) / 2 : 0

  const showDiff = (() => {
    const now = new Date()
    if (now.getDay() === 0 || now.getDay() === 6) return true
    const h = now.getHours(), m = now.getMinutes()
    return !((h === 9 && m >= 30) || h === 10 || (h === 11 && m < 30) || h === 13 || h === 14)
  })()
  const diffAmt = (showDiff && yesterday?.total && todayAmt) ? todayAmt - yesterday.total : 0
  const diffStr = diffAmt ? ((diffAmt > 0 ? '+' : '') + (diffAmt / 1e8).toFixed(0) + '亿') : ''

  useEffect(() => {
    fetch('/api/yesterday-turnover').then(r => r.json()).then(d => d.total && setYesterday(d)).catch(() => {})
  }, [])

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="home" />
      <div className="px-4 py-3 flex flex-col gap-3">
        {isInitialLoad ? <SkeletonMarketCards /> : <MarketBar quotes={quotes} />}

        {/* 子标签 */}
        <div className="flex gap-1.5 sticky top-[52px] bg-[#0A0F14] z-10 pb-1">
          <button onClick={() => setSubTab('sentiment')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${subTab==='sentiment' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            情绪
          </button>
          <button onClick={() => setSubTab('indicators')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${subTab==='indicators' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            <BarChart3 size={13} className="inline mr-1" />指标
          </button>
        </div>

        {subTab === 'sentiment' ? (
          <>
            {isInitialLoad ? <SkeletonHomeStats /> : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-3">
                  <div className="text-[10px] text-[#6B7280] mb-1">两市成交额</div>
                  <div className="text-base font-bold text-[#F0F2F5]">{totalTurnover}</div>
                  {diffStr && <div className={`text-[10px] font-medium mt-0.5 ${diffAmt > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>较昨日 {diffStr}</div>}
                </div>
                <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-3">
                  <div className="text-[10px] text-[#6B7280] mb-1">市场温度</div>
                  <Thermometer pct={avgChg} ready={dataReady} />
                </div>
              </div>
            )}
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
          </>
        ) : (
          <Suspense fallback={<div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>}>
            <IndicatorsPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}
