import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar'
import MarketBar from '../components/MarketBar'
import { useApp } from '../context/AppContext.jsx'
import { MACRO_INTERVAL, CACHE_TTL } from '../lib/constants.js'
import { TrendingUp, Landmark, DollarSign, Banknote, BarChart3 } from 'lucide-react'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'

function LineChart({ data, lines, shData, height = 110 }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !data || data.length < 2) return
    const width = containerRef.current.clientWidth || 170
    const chartData = data.map((d, i) => ({ time: i, ...d }))

    if (!chartRef.current) {
      // First render: create chart & series
      const chart = createChart(containerRef.current, {
        width, height,
        layout: { background: { type: ColorType.Solid, color: '#0D1117' }, textColor: 'rgba(255,255,255,0.4)' },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        crosshair: { mode: 1 },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        handleScroll: false, handleScale: false,
      })
      const seriesMap = {}
      lines.forEach(line => {
        const s = chart.addSeries(LineSeries, { color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        if (line.dash) s.applyOptions({ lineStyle: 2 })
        s.setData(chartData.map(d => ({ time: d.time, value: d[line.key] || 0 })))
        seriesMap[line.key] = s
      })
      if (shData) {
        const shMap = {}; shData.forEach(s => { shMap[s.date] = s.close })
        const shVals = data.map(d => shMap[d.date]).filter(v => v != null)
        if (shVals.length > 1) {
          const shSeries = chart.addSeries(LineSeries, { color: 'rgba(180,180,180,0.5)', lineWidth: 0.8, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, priceScaleId: 'sh' })
          chart.priceScale('sh').applyOptions({ visible: false })
          shSeries.setData(chartData.map(d => ({ time: d.time, value: shMap[d.date] || null })).filter(d => d.value != null))
          seriesMap._sh = shSeries
        }
      }
      chart.timeScale().fitContent()
      chartRef.current = { chart, seriesMap }
    } else {
      // Update existing series data
      const { seriesMap } = chartRef.current
      lines.forEach(line => {
        const s = seriesMap[line.key]
        if (s) s.setData(chartData.map(d => ({ time: d.time, value: d[line.key] || 0 })))
      })
      if (shData && seriesMap._sh) {
        const shMap = {}; shData.forEach(s => { shMap[s.date] = s.close })
        seriesMap._sh.setData(chartData.map(d => ({ time: d.time, value: shMap[d.date] || null })).filter(d => d.value != null))
      }
    }

    return () => { if (chartRef.current) { chartRef.current.chart.remove(); chartRef.current = null } }
  }, [data, lines, shData, height])

  if (!data || data.length < 2) return <div className="text-[9px] text-[#4D545C] text-center py-4">暂无数据</div>
  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 4, overflow: 'hidden' }} />
}

function IndicatorCard({ title, data, lines, rows, loading, shData, icon: Icon }) {
  return (
    <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-2.5 flex flex-col gap-1.5">
      <div className="text-[10px] font-medium text-[#8D949E] flex items-center gap-1"><Icon size={12} />{title}</div>
      {loading ? <div className="text-[9px] text-[#4D545C] py-4 text-center">加载中...</div> : <>
        <LineChart data={data} lines={lines} shData={shData} />
        <div className="text-[8px] text-[#6B7280] overflow-x-auto">
          <table className="w-full">
            <thead><tr>{rows.headers.map((h,i) => <th key={i} className="text-left font-normal pr-1">{h}</th>)}</tr></thead>
            <tbody>{(data||[]).slice(-5).reverse().map((d,i) => (
              <tr key={i} className="border-t border-[#1A2129]">{rows.cells.map((c,ci) => <td key={ci} className="py-0.5 pr-1">{c(d)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </>}
    </div>
  )
}

const toArray = (d) => Array.isArray(d) ? d : (d?.result?.data || d?.macro || d?.data || [])
const CACHE_KEYS = ['fh_indicator_m1m2','fh_indicator_loan','fh_indicator_reserve','fh_indicator_sh']

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })
}

export default function IndicatorsPage() {
  const { quotes } = useApp()
  const [m1m2, setM1m2] = useState(null)
  const [loan, setLoan] = useState(null)
  const [reserve, setReserve] = useState(null)
  const [shMonthly, setShMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const fetchRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    try {
      const raw = CACHE_KEYS.map(k => localStorage.getItem(k))
      if (raw.every(Boolean)) {
        const p = raw.map(r => JSON.parse(r))
        if (p.every(x => x && Date.now() - x.ts < CACHE_TTL)) {
          setM1m2(p[0].data); setLoan(p[1].data)
          setReserve(p[2].data); setShMonthly(p[3].data)
          setLastUpdate(fmtTime(p[0].ts))
          setLoading(false)
        }
      }
    } catch(e) {}

    let timer = null

    async function fetchAll() {
      if (cancelled) return
      try {
        const [m1R, loanR, resR, shR] = await Promise.all([
          fetch('/api/macro-data?report=CURRENCY_SUPPLY'),
          fetch('/api/macro-data?report=RMB_LOAN'),
          fetch('/api/macro-data?report=DEPOSIT_RESERVE'),
          fetch('/api/sh-monthly'),
        ])
        const [m1D, loanD, resD, shD] = await Promise.all([m1R.json(), loanR.json(), resR.json(), shR.json()])
        if (cancelled) return
        const m1a = toArray(m1D), la = toArray(loanD)
        const ra = toArray(resD), shA = Array.isArray(shD) ? shD : []
        const now = Date.now()
        try {
          const arr = [{data:m1a,ts:now},{data:la,ts:now},{data:ra,ts:now},{data:shA,ts:now}]
          CACHE_KEYS.forEach((k,i) => localStorage.setItem(k, JSON.stringify(arr[i])))
        } catch(e) {}
        setM1m2(m1a); setLoan(la); setReserve(ra); setShMonthly(shA)
        setLastUpdate(fmtTime(now))
        setLoading(false)
      } catch(e) { if (!cancelled) setLoading(false) }
    }

    fetchAll()
    timer = setInterval(fetchAll, MACRO_INTERVAL)
    fetchRef.current = fetchAll
    return () => { cancelled = true; clearInterval(timer); fetchRef.current = null }
  }, [])

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="indicators" />
      <div className="pt-3"><MarketBar quotes={quotes} /></div>
      <div className="px-4 pt-5 pb-2 flex items-center gap-1.5">
        <BarChart3 size={14} className="text-[#8D949E]" />
        <span className="text-xs font-medium text-[#8D949E]">先行指标</span>
        {lastUpdate && !loading && <span className="text-[10px] text-[#4D545C] ml-2">更新 {lastUpdate}</span>}
      </div>
      <div className="px-4 pb-6 grid grid-cols-2 gap-2">
        <IndicatorCard icon={TrendingUp} title="M1/M2 货币供应" data={m1m2} shData={shMonthly} lines={[{key:'m1Yoy',color:'#3B82F6'},{key:'m2Yoy',color:'#EAB308',dash:'4,2'}]} loading={loading}
          rows={{headers:['月','M1%','M2%','M1万亿'],cells:[d=>d?.date?.slice(2),d=>d?.m1Yoy?.toFixed(1),d=>d?.m2Yoy?.toFixed(1),d=>d?.m1?.toFixed(1)]}} />
        <IndicatorCard icon={Landmark} title="新增贷款" data={loan} shData={shMonthly} lines={[{key:'loan',color:'#22C55E'}]} loading={loading}
          rows={{headers:['月','新增(亿)','同比%','累计万亿'],cells:[d=>d?.date?.slice(2),d=>d?.loan?.toFixed(0),d=>d?.loanYoy?.toFixed(1),d=>d?.loanAcc?.toFixed(1)]}} />
        <IndicatorCard icon={DollarSign} title="贷款增速" data={loan} shData={shMonthly} lines={[{key:'loanYoy',color:'#3B82F6'}]} loading={loading}
          rows={{headers:['月','同比%','累计万亿',''],cells:[d=>d?.date?.slice(2),d=>d?.loanYoy?.toFixed(1),d=>d?.loanAcc?.toFixed(1),()=>'']}} />
        <IndicatorCard icon={Banknote} title="准备金率" data={reserve} shData={shMonthly} lines={[{key:'reserveRate',color:'#F97316'}]} loading={loading}
          rows={{headers:['日','准备金%','变动bp','上证次日'],cells:[d=>d?.date,d=>d?.reserveRate?.toFixed(2),d=>(d?.reserveChange>0?'+':'')+d?.reserveChange,d=>(d?.shNext>0?'+':'')+d?.shNext?.toFixed(2)+'%']}} />
      </div>
    </div>
  )
}
