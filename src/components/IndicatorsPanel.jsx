import { useState, useEffect, useRef, useMemo } from 'react'
import { MACRO_INTERVAL, CACHE_TTL } from '../lib/constants.js'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import { getChartTheme } from '../lib/chartTheme.js'

function LineChart({ data, lines, shData, height = 110 }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const theme = useMemo(() => getChartTheme(), [])

  useEffect(() => {
    if (!containerRef.current || !data || data.length < 2) return
    const width = containerRef.current.clientWidth || 170
    const chartData = data.map((d, i) => ({ time: i, ...d }))

    if (!chartRef.current) {
      const chart = createChart(containerRef.current, {
        width, height,
        layout: { background: { type: ColorType.Solid, color: theme.bg }, textColor: theme.text, fontFamily: 'Inter, sans-serif' },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        crosshair: { mode: 1 },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        handleScroll: false, handleScale: false,
      })
      const seriesMap = {}
      lines.forEach(line => {
        const s = chart.addSeries(LineSeries, { color: line.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
        if (line.dash) s.applyOptions({ lineStyle: 2 })
        s.setData(chartData.map(d => ({ time: d.time, value: d[line.key] || 0 })))
        seriesMap[line.key] = s
      })
      if (shData) {
        const shMap = {}; shData.forEach(s => { shMap[s.date] = s.close })
        const shVals = data.map(d => shMap[d.date]).filter(v => v != null)
        if (shVals.length > 1) {
          const shSeries = chart.addSeries(LineSeries, { color: theme.compare, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, priceScaleId: 'sh' })
          chart.priceScale('sh').applyOptions({ visible: false })
          shSeries.setData(chartData.map(d => ({ time: d.time, value: shMap[d.date] || null })).filter(d => d.value != null))
          seriesMap._sh = shSeries
        }
      }
      chart.timeScale().fitContent()
      chartRef.current = { chart, seriesMap }
    } else {
      const { seriesMap } = chartRef.current
      lines.forEach(line => {
        const s = seriesMap[line.key]
        if (s) s.setData(chartData.map(d => ({ time: d.time, value: d[line.key] || 0 })))
      })
    }
    return () => { if (chartRef.current) { chartRef.current.chart.remove(); chartRef.current = null } }
  }, [data, lines, shData])

  if (!data || data.length < 2) return <div className="text-[9px] text-[var(--text-3)] text-center py-4">暂无数据</div>
  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 6, overflow: 'hidden' }} />
}

function IndicatorCard({ title, data, lines, rows, loading, shData }) {
  return (
    <div className="panel panel-hover p-3 flex flex-col gap-2">
      <div className="text-[11px] font-semibold text-[var(--text-2)] flex items-center gap-1.5">{title}</div>
      {loading ? <div className="text-[9px] text-[var(--text-3)] py-6 text-center">加载中...</div> : <>
        <LineChart data={data} lines={lines} shData={shData} />
        <div className="text-[9px] text-[var(--text-3)] overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead><tr>{rows.headers.map((h,i) => <th key={i} className="text-left font-normal pr-1 text-[var(--text-3)]">{h}</th>)}</tr></thead>
            <tbody>{(data||[]).slice(-5).reverse().map((d,i) => (
              <tr key={i} className="border-t border-[var(--border-soft)]">{rows.cells.map((c,ci) => <td key={ci} className="py-1 pr-1 text-[var(--text)] num">{c(d)}</td>)}</tr>
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

export default function IndicatorsPanel() {
  const theme = useMemo(() => getChartTheme(), [])
  const [m1m2, setM1m2] = useState(null)
  const [loan, setLoan] = useState(null)
  const [reserve, setReserve] = useState(null)
  const [shMonthly, setShMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

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
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  return (
    <div>
      {lastUpdate && <div className="text-[10px] text-[var(--text-3)] mb-2 text-right">更新于 {lastUpdate}</div>}
      <div className="g-4">
        <IndicatorCard title="M1/M2 货币供应" data={m1m2} shData={shMonthly} lines={[{key:'m1Yoy',color:theme.gold},{key:'m2Yoy',color:theme.goldBright,dash:'4,2'}]} loading={loading}
          rows={{headers:['月','M1%','M2%','M1万亿'],cells:[d=>d?.date?.slice(2),d=>d?.m1Yoy?.toFixed(1),d=>d?.m2Yoy?.toFixed(1),d=>d?.m1?.toFixed(1)]}} />
        <IndicatorCard title="新增贷款" data={loan} shData={shMonthly} lines={[{key:'loan',color:theme.down}]} loading={loading}
          rows={{headers:['月','新增(亿)','同比%','累计万亿'],cells:[d=>d?.date?.slice(2),d=>d?.loan?.toFixed(0),d=>d?.loanYoy?.toFixed(1),d=>d?.loanAcc?.toFixed(1)]}} />
        <IndicatorCard title="贷款增速" data={loan} shData={shMonthly} lines={[{key:'loanYoy',color:theme.gold}]} loading={loading}
          rows={{headers:['月','同比%','累计万亿',''],cells:[d=>d?.date?.slice(2),d=>d?.loanYoy?.toFixed(1),d=>d?.loanAcc?.toFixed(1),()=>'']}} />
        <IndicatorCard title="准备金率" data={reserve} shData={shMonthly} lines={[{key:'reserveRate',color:theme.up}]} loading={loading}
          rows={{headers:['日','准备金%','变动bp','上证次日'],cells:[d=>d?.date,d=>d?.reserveRate?.toFixed(2),d=>(d?.reserveChange>0?'+':'')+d?.reserveChange,d=>(d?.shNext>0?'+':'')+d?.shNext?.toFixed(2)+'%']}} />
      </div>
    </div>
  )
}
