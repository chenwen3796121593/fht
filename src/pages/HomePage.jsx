import { useState, useEffect, lazy, Suspense } from 'react'
import TopBar from '../components/TopBar'
import MarketBar from '../components/MarketBar'
import { useApp } from '../context/AppContext.jsx'
import { SkeletonMarketCards, SkeletonHomeStats } from '../components/Skeleton.jsx'
import { Activity, TrendingUp, Snowflake, Flame, BarChart3, ArrowDownRight, ArrowUpRight } from 'lucide-react'

const IndicatorsPanel = lazy(() => import('../components/IndicatorsPanel'))

function Thermometer({ pct, ready }) {
  const color = ready ? (pct > 0 ? 'var(--up)' : pct < 0 ? 'var(--down)' : 'var(--gold)') : 'var(--text-3)'
  return (
    <div className="flex items-center gap-2">
      <Snowflake size={13} style={{ color }} />
      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: ready ? Math.max(5, Math.min(100, 50 + pct * 20)) + '%' : '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <Flame size={13} style={{ color }} />
    </div>
  )
}

function StatBlock({ label, value, sub, className = '' }) {
  return (
    <div className={`panel p-3.5 flex flex-col gap-1 ${className}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value num leading-none">{value}</span>
      {sub && <div className="text-[10px]">{sub}</div>}
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
    <div className="panel p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title"><TrendingUp size={14} className="text-[var(--gold)]" />板块资金</div>
        <div className="flex gap-1.5">
          <button onClick={() => setTab('in')} className={`chip ${tab === 'in' ? 'chip-active' : ''}`}>流入 TOP</button>
          <button onClick={() => setTab('out')} className={`chip ${tab === 'out' ? 'chip-active' : ''}`}>流出 TOP</button>
        </div>
      </div>
      {data && data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.map((item, i) => {
            const name = item.name || '?'
            const flow = (item.netFlow || 0) / 1e8
            const barW = Math.max(3, Math.abs(flow) / (maxFlow / 1e8) * 100)
            const up = flow > 0
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <span className="w-20 text-[var(--text-2)] truncate" title={name}>{name}</span>
                <div className="flex-1 h-2.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: barW + '%', backgroundColor: up ? 'var(--up)' : 'var(--down)' }} />
                </div>
                <span className="w-16 text-right font-semibold num" style={{ color: up ? 'var(--up)' : 'var(--down)' }}>
                  {up ? '+' : ''}{flow.toFixed(1)}亿
                </span>
                <span className="w-12 text-right num" style={{ color: (item.change||0) >= 0 ? 'var(--up)' : 'var(--down)' }}>
                  {(item.change||0) >= 0 ? '+' : ''}{(item.change||0).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-xs text-[var(--text-3)] py-5 text-center">加载中...</div>
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
  const prevDiffAmt = (showDiff && yesterday?.prevTotal && todayAmt) ? todayAmt - yesterday.prevTotal : 0
  const prevDiffStr = prevDiffAmt ? ((prevDiffAmt > 0 ? '+' : '') + (prevDiffAmt / 1e8).toFixed(0) + '亿') : ''

  useEffect(() => {
    fetch('/api/yesterday-turnover').then(r => r.json()).then(d => d.total && setYesterday(d)).catch(() => {})
  }, [])

  return (
    <div className="bg-[var(--bg)] h-full overflow-y-auto scroll-thin">
      <TopBar active="home" />
      <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-3">
        {/* 页面标题区 */}
        <div className="flex items-end justify-between fade-up">
          <div>
            <div className="eyebrow hidden md:block">Market Overview</div>
            <h1 className="h1 mt-0.5">市场概览</h1>
          </div>
          <div className="text-[11px] text-[var(--text-3)] num flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--down)] inline-block animate-pulse" />实时行情
          </div>
        </div>

        {isInitialLoad ? <SkeletonMarketCards /> : <MarketBar quotes={quotes} />}

        {/* 子标签（桌面吸顶到 0） */}
        <div className="flex gap-1.5 sticky top-[57px] md:top-0 bg-[var(--bg)]/90 backdrop-blur z-10 pb-1 pt-0.5 -mx-4 px-4 md:-mx-6 md:px-6">
          <button onClick={() => setSubTab('sentiment')} className={`chip ${subTab==='sentiment' ? 'chip-active' : ''}`}><Activity size={13} />情绪</button>
          <button onClick={() => setSubTab('indicators')} className={`chip ${subTab==='indicators' ? 'chip-active' : ''}`}><BarChart3 size={13} />指标</button>
        </div>

        {subTab === 'sentiment' ? (
          <>
            {isInitialLoad ? <SkeletonHomeStats /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock
                  className="md:col-span-2"
                  label="两市成交额"
                  value={totalTurnover}
                  sub={(() => {
                    if (!(diffStr || prevDiffStr)) return null
                    return (
                      <div className="flex gap-2 flex-wrap">
                        {diffStr && <span className="flex items-center gap-0.5"><span className="text-[var(--text-3)]">较昨</span><span className="font-semibold" style={{ color: diffAmt > 0 ? 'var(--up)' : 'var(--down)' }}>{diffAmt > 0 ? <ArrowUpRight size={11} className="inline"/> : <ArrowDownRight size={11} className="inline"/>}{diffStr}</span></span>}
                        {prevDiffStr && <span className="flex items-center gap-0.5"><span className="text-[var(--text-3)]">较前</span><span className="font-semibold" style={{ color: prevDiffAmt > 0 ? 'var(--up)' : 'var(--down)' }}>{prevDiffStr}</span></span>}
                      </div>
                    )
                  })()}
                />
                <div className="panel p-3.5 flex flex-col gap-1.5 md:col-span-2">
                  <span className="kpi-label">市场温度</span>
                  <Thermometer pct={avgChg} ready={dataReady} />
                  <span className="text-[10px] text-[var(--text-3)] text-right num">{avgChg >= 0 ? '+' : ''}{avgChg.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="panel p-4">
                <div className="section-title mb-3"><Activity size={14} className="text-[var(--gold)]" />市场涨跌</div>
                {breadth ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-2">
                    <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-2)]">上涨家数</span><span className="text-base font-bold t-up num">{breadth.up}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-2)]">下跌家数</span><span className="text-base font-bold t-down num">{breadth.down}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-2)]">涨停家数</span><span className="text-base font-bold t-up num">{breadth.limUp}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-2)]">跌停家数</span><span className="text-base font-bold t-down num">{breadth.limDown}</span></div>
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-3)]">加载中...</div>
                )}
              </div>
              <SectorFlow />
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="text-center text-[var(--text-3)] text-sm py-12">加载中...</div>}>
            <IndicatorsPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}
