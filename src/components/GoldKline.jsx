import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineStyle } from 'lightweight-charts'
import { Loader2 } from 'lucide-react'
import { getChartTheme } from '../lib/chartTheme.js'

// 各周期用于计算支撑/阻力的回看窗口（根数）
const WINDOW_FOR = { '1h': 120, '4h': 80, d: 60, w: 52, m: 24 }

const PERIODS = [
  { label: '小时', key: '1h' },
  { label: '4小时', key: '4h' },
  { label: '日线', key: 'd' },
  { label: '周线', key: 'w' },
  { label: '月线', key: 'm' },
]

export default function GoldKline({ priceData }) {
  const theme = useMemo(() => getChartTheme(), [])
  const [period, setPeriod] = useState('d')
  const [kdata, setKdata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const chartRef = useRef(null)
  const containerRef = useRef(null)

  // AI 图表研判 状态
  const [chartUnlocked, setChartUnlocked] = useState(false)
  const [chartShowPwd, setChartShowPwd] = useState(false)
  const [chartPwd, setChartPwd] = useState('')
  const [chartPwdErr, setChartPwdErr] = useState('')
  const [chartReport, setChartReport] = useState('')
  const [chartLoading, setChartLoading] = useState(false)
  const [chartErr, setChartErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setKdata(null)
    setUnavailable(false)

    const ck = `goldkline_${period}`
    const cached = localStorage.getItem(ck)
    if (cached) {
      try {
        const { date, data } = JSON.parse(cached)
        if (date === new Date().toDateString() && data?.length) {
          if (!cancelled) { setKdata(data); setLoading(false); return }
        }
      } catch (e) {}
    }

    fetch(`/api/gold-kline?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json && json._unavailable) { setUnavailable(true); setLoading(false); return }
        const arr = Array.isArray(json) ? json : []
        if (!arr.length) { setLoading(false); return }
        if (!cancelled) {
          setKdata(arr)
          try { localStorage.setItem(ck, JSON.stringify({ date: new Date().toDateString(), data: arr.slice(-300) })) } catch (e) {}
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [period])

  const rt = priceData?.rawPrice || priceData?.price
  const displayData = useMemo(() => {
    if (!kdata) return []
    if (!rt) return kdata
    const d = [...kdata]
    const last = { ...d[d.length - 1] }
    last.close = rt
    last.high = Math.max(last.high || 0, rt)
    last.low = Math.min(last.low == null ? Infinity : last.low, rt)
    d[d.length - 1] = last
    return d
  }, [kdata, rt])

  const toTime = (d, i) => {
    if (!d.day) return i
    return d.day.length > 10 ? Math.floor(new Date(d.day).getTime() / 1000) : d.day
  }
  const toCandle = (d, i) => ({ time: toTime(d, i), open: d.open, high: d.high, low: d.low, close: d.close })
  const toVol = (d, i) => ({ time: toTime(d, i), value: d.volume || 0, color: d.close >= d.open ? theme.upFill : theme.downFill })

  // 计算支撑 / 阻力 / 枢轴参考线
  const refLines = useMemo(() => {
    if (!displayData.length) return []
    const win = WINDOW_FOR[period] || 60
    const seg = displayData.slice(-win)
    const lows = seg.map((d) => d.low).filter((v) => v != null && isFinite(v))
    const highs = seg.map((d) => d.high).filter((v) => v != null && isFinite(v))
    if (!lows.length || !highs.length) return []
    const support = Math.min(...lows)
    const resistance = Math.max(...highs)
    const last = displayData[displayData.length - 1]
    const pivot = last?.close != null ? (Math.max(...highs) + Math.min(...lows) + last.close) / 3 : (support + resistance) / 2
    const cur = rt || last?.close
    const out = [
      { key: 'res', title: '阻力', price: resistance, color: theme.up, style: LineStyle.Dashed },
      { key: 'sup', title: '支撑', price: support, color: theme.down, style: LineStyle.Dashed },
      { key: 'pp', title: '枢轴', price: pivot, color: theme.gold, style: LineStyle.Dotted },
    ]
    if (cur != null && isFinite(cur)) out.push({ key: 'live', title: '现价', price: cur, color: theme.muted, style: LineStyle.LargeDashed })
    // 过滤掉互相过于接近（<0.05%）导致重叠的线
    return out.filter((l) => l.price != null && isFinite(l.price) &&
      out.every((o) => o.key === l.key || Math.abs(o.price - l.price) / (l.price || 1) > 0.0005))
  }, [displayData, period, rt])

  // 创建图表（仅一次）
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 280,
      layout: { background: { type: ColorType.Solid, color: theme.bg }, textColor: theme.text, fontFamily: 'Inter, sans-serif' },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: theme.border, scaleMargins: { top: 0.08, bottom: 0.25 } },
      timeScale: { borderColor: theme.border, timeVisible: period === '1h' || period === '4h', secondsVisible: false },
    })
    const cs = chart.addSeries(CandlestickSeries, {
      upColor: theme.up, downColor: theme.down,
      borderUpColor: theme.up, borderDownColor: theme.down,
      wickUpColor: theme.up, wickDownColor: theme.down,
    })
    const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    vs.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    const onResize = () => chart.applyOptions({ width: container.clientWidth })
    window.addEventListener('resize', onResize)
    chartRef.current = { chart, cs, vs, priceLines: [] }
    return () => {
      window.removeEventListener('resize', onResize)
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // 数据 + 支撑/阻力/枢轴/现价 参考线（每次数据或周期变化都重绘）
  useEffect(() => {
    const prev = chartRef.current
    if (!prev) return
    // 先移除上一批参考线（无论是否处于加载空数据），避免不同周期的线残留堆叠
    if (prev.priceLines) {
      prev.priceLines.forEach((pl) => { try { prev.cs.removePriceLine(pl) } catch (e) {} })
      prev.priceLines = []
    }
    if (!displayData.length) return
    prev.cs.setData(displayData.map((d, i) => toCandle(d, i)))
    prev.vs.setData(displayData.map((d, i) => toVol(d, i)))
    prev.chart.applyOptions({ timeScale: { timeVisible: period === '1h' || period === '4h', secondsVisible: false } })

    prev.priceLines = refLines.map((l) =>
      prev.cs.createPriceLine({
        price: l.price,
        color: l.color,
        lineWidth: 1,
        lineStyle: l.style,
        axisLabelVisible: true,
        title: l.title,
      })
    )
  }, [displayData, period, refLines])

  const up = (priceData?.change || 0) >= 0

  // =========== AI 图表研判 ===========
  const sha256 = (s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

  const runChartRead = async () => {
    if (chartLoading) return
    setChartLoading(true); setChartReport(''); setChartErr('')
    const hash = await sha256(chartPwd)
    try {
      const res = await fetch('/api/ai-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pwd: hash }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || `HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ') || line.startsWith('data: [DONE]')) continue
          try {
            const j = JSON.parse(line.slice(6))
            const c = j?.choices?.[0]?.delta?.content
            if (c) setChartReport(prev => prev + c)
          } catch {}
        }
      }
    } catch (e) {
      setChartErr(e.message)
    } finally {
      setChartLoading(false)
    }
  }

  const verifyChartPwd = async () => {
    if (!chartPwd.trim()) return
    const hash = await sha256(chartPwd)
    try {
      const res = await fetch('/api/verify-pwd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) })
      if (res.ok) { setChartUnlocked(true); setChartShowPwd(false); setChartPwdErr(''); runChartRead() }
      else setChartPwdErr('密码错误，请重试')
    } catch { setChartPwdErr('验证失败，请重试') }
  }

  const onChartRead = () => {
    if (chartUnlocked) runChartRead()
    else setChartShowPwd(true)
  }

  return (
    <div className="panel p-3.5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: up ? theme.up : theme.down }} />
            伦敦黄金 · XAU
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-[var(--text)] num">{priceData?.formattedPrice || priceData?.price || '--'}</span>
            {priceData?.change != null && (
              <span className={`text-[13px] font-semibold num ${up ? 't-up' : 't-down'}`}>
                {up ? '+' : ''}{(priceData.change || 0).toFixed(2)}%
              </span>
            )}
            <span className="text-[10px] text-[var(--text-3)]">美元/盎司</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap items-center">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`chip ${period === p.key ? 'chip-active' : ''}`}>{p.label}</button>
        ))}
        <button onClick={onChartRead}
          className={`chip ${chartUnlocked ? 'chip-active' : ''} ml-auto`}>
          AI 读图
        </button>
      </div>

      {chartShowPwd && (
        <div className="flex items-center gap-2 mb-3">
          <input type="password" value={chartPwd} onChange={(e) => setChartPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verifyChartPwd()}
            placeholder="请输入分析密码"
            className="field flex-1" />
          <button onClick={verifyChartPwd} className="btn-gold shrink-0">确认</button>
          {chartPwdErr && <span className="text-[11px] text-[var(--up)]">{chartPwdErr}</span>}
        </div>
      )}

      {loading && (
        <div className="w-full flex items-center justify-center rounded-lg" style={{ height: 280, background: theme.bg }}>
          <span className="text-sm text-[var(--text-3)]">加载中...</span>
        </div>
      )}
      {!loading && !kdata && !unavailable && (
        <div className="w-full flex items-center justify-center rounded-lg" style={{ height: 280, background: theme.bg }}>
          <span className="text-sm text-[var(--text-3)]">暂无 K 线数据</span>
        </div>
      )}
      {!loading && unavailable && (
        <div className="w-full flex items-center justify-center rounded-lg px-4 text-center" style={{ height: 280, background: theme.bg }}>
          <span className="text-sm text-[var(--text-3)] leading-relaxed">
            国内公开数据源仅提供日线及以上周期，<br/>小时 / 4 小时分钟级 K 线暂不可用，<br/>请切换「日线 / 周线 / 月线」查看
          </span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: displayData.length > 0 ? 280 : 0, overflow: 'hidden' }} />

      {refLines.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
          {refLines.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-3 h-[2px]" style={{ background: l.color }} />
              <span className="text-[var(--text-3)]">{l.title}</span>
              <span className="num font-medium" style={{ color: l.color }}>{l.price.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {chartLoading && (
        <div className="mt-3 text-[12px] text-[var(--text-3)] flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> 正在生成图表研判…
        </div>
      )}
      {chartErr && <div className="mt-3 text-[12px] text-[var(--up)]">{chartErr}</div>}
      {chartReport && (
        <div className="panel p-4 mt-3">
          <div className="text-[11px] text-[var(--gold)] mb-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[var(--gold)]" /> AI 图表研判
          </div>
          <div className="text-[13px] text-[var(--text)] leading-relaxed whitespace-pre-wrap">
            {chartReport}
            {chartLoading && <span className="inline-block w-2 h-4 bg-[var(--gold)] ml-0.5 animate-pulse rounded-sm align-middle" />}
          </div>
        </div>
      )}
    </div>
  )
}
