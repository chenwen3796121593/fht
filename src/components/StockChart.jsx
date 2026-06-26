import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import { normalizeSymbol } from '../lib/constants.js'

function fmtPrice(v, symbol) {
  if (v == null) return '--'
  const n = Number(v)
  if (symbol.includes('XAU') || symbol.includes('GC')) return '$' + n.toFixed(1)
  if (symbol.startsWith('sh') || symbol.startsWith('sz')) return n.toFixed(2)
  if (symbol.includes('XAG') || symbol.includes('CL')) return '$' + n.toFixed(2)
  if (symbol.includes('HG') || symbol.includes('CU')) return '$' + n.toFixed(0)
  if (n >= 1000) return n.toFixed(0)
  return '$' + n.toFixed(2)
}

function todayStr() { return new Date().toDateString() }

export default function StockChart({ symbol, name, priceData }) {
  const [range, setRange] = useState('日线')
  const [kdata, setKdata] = useState(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef(null)
  const containerRef = useRef(null)

  const isCommodity = symbol.startsWith('hf_') || symbol.startsWith('nf_')
  const isIntraday = range === '分时'
  const options = isCommodity ? ['日线', '全部'] : ['分时', '日线', '全部']

  // Fetch K-line
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
          day: d.day || '',
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

  const toTime = (d) => d.day && d.day.length > 10 ? Math.floor(new Date(d.day).getTime() / 1000) : (d.day || 0)

  // Create chart once when data source changes
  useEffect(() => {
    if (!containerRef.current || !displayData.length) return
    const container = containerRef.current
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 220,
      layout: { background: { type: ColorType.Solid, color: '#0D1117' }, textColor: '#4D545C' },
      grid: { vertLines: { color: '#1A2129' }, horzLines: { color: '#1A2129' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#242B33', scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: '#242B33', timeVisible: isIntraday, secondsVisible: false },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#EF4444', downColor: '#22C55E',
      borderUpColor: '#EF4444', borderDownColor: '#22C55E',
      wickUpColor: '#EF4444', wickDownColor: '#22C55E',
    })
    candleSeries.setData(displayData.map(d => ({
      time: toTime(d), open: d.open, high: d.high, low: d.low, close: d.close,
    })))

    const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
    volumeSeries.setData(displayData.map(d => ({
      time: toTime(d), value: d.volume || 0,
      color: d.close >= d.open ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)',
    })))

    // Store refs for incremental updates
    chartRef.current = { chart, candleSeries, volumeSeries }
    const onResize = () => chart.applyOptions({ width: container.clientWidth })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove(); chartRef.current = null }
  }, [kdata, isIntraday])

  // Incremental update: last candle only
  useEffect(() => {
    const ref = chartRef.current
    if (!ref || !displayData.length) return
    const last = displayData[displayData.length - 1]
    const t = toTime(last)
    ref.candleSeries.update({ time: t, open: last.open, high: last.high, low: last.low, close: last.close })
    ref.volumeSeries.update({ time: t, value: last.volume || 0, color: last.close >= last.open ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)' })
  }, [rt, priceData?.high, priceData?.low])

  return (
    <div className="px-4 pb-3">
      <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5">
        <div className="mb-3">
          <div className="text-sm font-semibold text-[#F0F2F5]">{symbol} · {name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg font-bold text-[#F0F2F5]">{priceData?.formattedPrice || priceData?.price || '--'}</span>
            {priceData?.change != null && (
              <span className={`text-[13px] font-medium ${(priceData.change || 0) >= 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                {(priceData.change || 0) >= 0 ? '+' : ''}{(priceData.change || 0).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 mb-3">
          {options.map(t => (
            <button key={t} onClick={() => setRange(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${range === t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{t}</button>
          ))}
        </div>
        {loading && <div className="w-full bg-[#0D1117] rounded-md flex items-center justify-center" style={{ height: 220 }}><span className="text-sm text-[#4D545C]">加载中...</span></div>}
        {!loading && !kdata && <div className="w-full bg-[#0D1117] rounded-md flex items-center justify-center" style={{ height: 220 }}><span className="text-sm text-[#4D545C]">暂无 K 线数据</span></div>}
        <div ref={containerRef} style={{ width: '100%', height: displayData.length > 0 ? 220 : 0, overflow: 'hidden' }} />
      </div>
    </div>
  )
}
