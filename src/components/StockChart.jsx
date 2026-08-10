import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import { normalizeSymbol } from '../lib/constants.js'
import { getChartTheme } from '../lib/chartTheme.js'

function todayStr() { return new Date().toDateString() }

export default function StockChart({ symbol, name, priceData }) {
  const [range, setRange] = useState('日线')
  const [kdata, setKdata] = useState(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef(null)
  const containerRef = useRef(null)
  const theme = useMemo(() => getChartTheme(), [])

  const isCommodity = symbol.startsWith('hf_') || symbol.startsWith('nf_')
  const isIntraday = range === '分时'
  const options = isCommodity ? ['日线', '全部'] : ['分时', '日线', '全部']

  useEffect(() => {
    let cancelled = false; setLoading(true); setKdata(null)

    let apiSymbol = normalizeSymbol(symbol)

    const ck = `kline_${apiSymbol}_${range}`

    if (!isIntraday) {
      const cached = localStorage.getItem(ck)
      if (cached) {
        try {
          const { date, data } = JSON.parse(cached)
          if (date === todayStr() && data?.length > 0) {
            if (!cancelled) { setKdata(range === '全部' ? data : data.slice(-30)); setLoading(false); return }
          }
        } catch (e) {}
      }
    }

    const params = isIntraday ? '&scale=5&intraday=1' : range === '全部' ? '&all=1' : ''
    fetch(`/api/kline?symbol=${apiSymbol}${params}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        const arr = Array.isArray(json) ? json : []
        const parsed = arr.map(d => ({
          open: parseFloat(d.open), close: parseFloat(d.close),
          high: parseFloat(d.high), low: parseFloat(d.low),
          volume: parseFloat(d.volume) || 0,
          day: d.day || d.date || '',
        })).filter(d => d.open && d.close)

        if (parsed.length === 0) { setLoading(false); return }

        const SAMPLE_MAX = isIntraday ? 240 : 300
        let toShow = parsed
        if (!isIntraday && range !== '全部') toShow = parsed.slice(-30)
        else if (!isIntraday && parsed.length > SAMPLE_MAX) {
          const step = Math.ceil(parsed.length / SAMPLE_MAX)
          toShow = parsed.filter((_, i) => i % step === 0 || i === parsed.length - 1)
        }

        if (toShow.length > 0) {
          if (!isIntraday && priceData?.price > 0 && range !== '全部') {
            const last = toShow[toShow.length - 1]
            if (last) toShow[toShow.length - 1] = { ...last, close: priceData.price, high: Math.max(last.high || 0, priceData.price), low: Math.min(last.low || Infinity, priceData.price) }
          }
          setKdata(toShow)
          if (!isIntraday && (parsed.length <= 300 || range !== '全部')) {
            try { localStorage.setItem(ck, JSON.stringify({ date: todayStr(), data: parsed.slice(-200) })) } catch(e) {}
          }
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [symbol, range, isIntraday])

  const rt = priceData?.rawPrice || priceData?.price
  const displayData = useMemo(() => {
    if (!kdata) return []
    if (isIntraday || !rt) return kdata
    const d = [...kdata]
    const last = { ...d[d.length - 1] }
    last.close = rt
    last.high = Math.max(last.high, rt, priceData?.high || rt)
    last.low = Math.min(last.low, rt, priceData?.low || rt)
    d[d.length - 1] = last
    return d
  }, [kdata, rt, isIntraday, priceData?.high, priceData?.low])

  const toTime = (d, i) => { if (!d.day) return i; return d.day.length > 10 ? Math.floor(new Date(d.day).getTime() / 1000) : d.day }
  const toCandle = (d, i) => ({ time: toTime(d, i), open: d.open, high: d.high, low: d.low, close: d.close })
  const toVol = (d, i) => ({ time: toTime(d, i), value: d.volume || 0, color: d.close >= d.open ? theme.upFill : theme.downFill })

  useEffect(() => {
    if (!containerRef.current || !displayData.length) return
    const container = containerRef.current
    const prev = chartRef.current

    if (!prev || prev.chart === null) {
      const chart = createChart(container, {
        width: container.clientWidth, height: 240,
        layout: { background: { type: ColorType.Solid, color: theme.bg }, textColor: theme.text, fontFamily: 'Inter, sans-serif' },
        grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: theme.border, scaleMargins: { top: 0.05, bottom: 0.25 } },
        timeScale: { borderColor: theme.border, timeVisible: isIntraday, secondsVisible: false },
      })
      const cs = chart.addSeries(CandlestickSeries, { upColor: theme.up, downColor: theme.down, borderUpColor: theme.up, borderDownColor: theme.down, wickUpColor: theme.up, wickDownColor: theme.down })
      const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      cs.setData(displayData.map((d,i) => toCandle(d,i)))
      vs.setData(displayData.map((d,i) => toVol(d,i)))
      chartRef.current = { chart, cs, vs }
      const onResize = () => chart.applyOptions({ width: container.clientWidth })
      window.addEventListener('resize', onResize)
      return () => { window.removeEventListener('resize', onResize); chart.remove(); chartRef.current = null }
    }

    if (prev.kdata !== kdata || prev.isIntraday !== isIntraday) {
      prev.cs.setData(displayData.map((d,i) => toCandle(d,i)))
      prev.vs.setData(displayData.map((d,i) => toVol(d,i)))
    } else {
      const last = displayData[displayData.length - 1]
      const t = toTime(last, displayData.length - 1)
      prev.cs.update({ time: t, open: last.open, high: last.high, low: last.low, close: last.close })
      prev.vs.update({ time: t, value: last.volume || 0, color: last.close >= last.open ? theme.upFill : theme.downFill })
    }
    prev.kdata = kdata
    prev.isIntraday = isIntraday
  }, [displayData, kdata, isIntraday])

  const up = (priceData?.change || 0) >= 0

  return (
    <div className="px-4 pb-3">
      <div className="panel p-3.5">
        <div className="mb-3">
          <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: up ? theme.up : theme.down }} />
            {name}
            <span className="text-[11px] font-mono text-[var(--text-3)]">{symbol}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-[var(--text)] num">{priceData?.formattedPrice || priceData?.price || '--'}</span>
            {priceData?.change != null && (
              <span className={`text-[13px] font-semibold num ${up ? 't-up' : 't-down'}`}>
                {up ? '+' : ''}{(priceData.change || 0).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 mb-3">
          {options.map(t => (
            <button key={t} onClick={() => setRange(t)}
              className={`chip ${range === t ? 'chip-active' : ''}`}>{t}</button>
          ))}
        </div>
        {loading && <div className="w-full flex items-center justify-center rounded-lg" style={{ height: 240, background: theme.bg }}><span className="text-sm text-[var(--text-3)]">加载中...</span></div>}
        {!loading && !kdata && <div className="w-full flex items-center justify-center rounded-lg" style={{ height: 240, background: theme.bg }}><span className="text-sm text-[var(--text-3)]">暂无 K 线数据</span></div>}
        <div ref={containerRef} style={{ width: '100%', height: displayData.length > 0 ? 240 : 0, overflow: 'hidden' }} />
      </div>
    </div>
  )
}
