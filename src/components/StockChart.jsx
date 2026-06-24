import React, { useState, useEffect, useMemo } from 'react'

const rangeLabels = ['日线', '全部']

function fmtPrice(v, symbol) {
  if (!v) return '--'
  if (symbol.includes('XAU') || symbol.includes('GC')) return '$' + Number(v).toFixed(1)
  if (symbol.startsWith('sh') || symbol.startsWith('sz')) return Number(v).toFixed(2)
  if (symbol.includes('XAG')) return '$' + Number(v).toFixed(2)
  if (symbol.includes('CL')) return '$' + Number(v).toFixed(2)
  if (symbol.includes('HG') || symbol.includes('CU')) return '$' + Number(v).toFixed(0)
  if (v >= 1000) return Number(v).toFixed(0)
  return '$' + Number(v).toFixed(2)
}

const CandleChart = React.memo(({ data, width = 310, height = 180 }) => {
  const p = useMemo(() => ({ top: 10, right: 8, bottom: 20, left: 52 }), [])
  const { cw, ch, toY, barW, lo, hi, range } = useMemo(() => {
    const cw = width - p.left - p.right, ch = height - p.top - p.bottom
    const nums = data.flatMap(d => [d.open, d.close, d.high, d.low])
    const lo = Math.min(...nums), hi = Math.max(...nums), range = hi - lo || 1
    return { cw, ch, lo, hi, range, toY: (v) => p.top + ((hi - v) / range) * ch, barW: Math.max(1, (cw / data.length) * 0.7) }
  }, [data, width, p])

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#0D1117" rx={6} />
      {[0, 1, 2, 3, 4].map(i => {
        const v = lo + (range / 4) * i, y = toY(v)
        return (
          <g key={i}>
            <line x1={p.left} y1={y} x2={width - p.right} y2={y} stroke="#1A2129" strokeWidth={0.5} />
            <text x={p.left - 5} y={y + 4} fill="#4D545C" fontSize={9} textAnchor="end">{v.toFixed(v >= 100 ? 0 : 2)}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = p.left + i * (cw / data.length), up = d.close >= d.open, color = up ? '#EF4444' : '#22C55E'
        const y1 = toY(Math.max(d.open, d.close)), y2 = toY(Math.min(d.open, d.close))
        const h = Math.max(1, y2 - y1), cx = x + barW / 2
        return <g key={i}><line x1={cx} y1={toY(d.high)} x2={cx} y2={toY(d.low)} stroke={color} strokeWidth={1} /><rect x={x + (cw / data.length - barW) / 2} y={y1} width={barW} height={h} fill={color} /></g>
      })}
    </svg>
  )
})

const VolChart = React.memo(function VolChart({ data, width = 310, height = 44 }) {
  const maxV = Math.max(...data.map(d => d.volume || 0), 1)
  const barW = Math.max(1, (width - 16) / data.length * 0.7)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#0D1117" rx={4} />
      {data.map((d, i) => {
        const h = Math.max(1, ((d.volume || 0) / maxV) * (height - 8))
        const up = d.close >= d.open
        return <rect key={i} x={8 + i * ((width - 16) / data.length) + ((width - 16) / data.length - barW) / 2}
          y={height - h} width={barW} height={h}
          fill={up ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'} />
      })}
    </svg>
  )
})

export default function StockChart({ symbol, name, priceData }) {
  const [range, setRange] = useState('日线')
  const [kdata, setKdata] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setKdata(null)

    // Normalize symbol: add market prefix for Chinese stocks
    let apiSymbol = symbol
    if (!apiSymbol.startsWith('sh') && !apiSymbol.startsWith('sz') && !apiSymbol.startsWith('bj') && !apiSymbol.startsWith('hf_') && !apiSymbol.startsWith('nf_')) {
      if (apiSymbol.startsWith('6')) apiSymbol = 'sh' + apiSymbol
      else if (apiSymbol.startsWith('0') || apiSymbol.startsWith('3')) apiSymbol = 'sz' + apiSymbol
      else if (apiSymbol.startsWith('8') || apiSymbol.startsWith('4')) apiSymbol = 'bj' + apiSymbol
    }

    const cacheKey = `kline_${apiSymbol}_${range}`
    const today = new Date().toDateString()

    // Try cache first
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { date, data } = JSON.parse(cached)
        if (date === today && data?.length > 0) {
          if (!cancelled) { setKdata(range === '全部' ? data : data.slice(-30)); setLoading(false); return }
        }
      } catch (e) {}
    }

    const allParam = range === '全部' ? '&all=1' : ''
    fetch(`/api/kline?symbol=${apiSymbol}${allParam}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        const arr = Array.isArray(json) ? json : []
        const parsed = arr.map(d => ({
          open: parseFloat(d.open), close: parseFloat(d.close),
          high: parseFloat(d.high), low: parseFloat(d.low),
          volume: parseFloat(d.volume) || 0,
        })).filter(d => d.open && d.close)
        const SAMPLE_MAX = 300
        let toShow = parsed
        if (range !== '全部') {
          toShow = parsed.slice(-30)
        } else if (parsed.length > SAMPLE_MAX) {
          const step = Math.ceil(parsed.length / SAMPLE_MAX)
          toShow = parsed.filter((_, i) => i % step === 0 || i === parsed.length - 1)
        }
        if (toShow.length > 0) {
          setKdata(toShow)
          try { if (parsed.length <= 300 || range !== '全部') localStorage.setItem(cacheKey, JSON.stringify({ date: today, data: parsed.slice(-200) })) } catch(e) {}
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [symbol, range])

  const hasData = !!priceData
  const last = kdata ? kdata[kdata.length - 1] : null
  const change = last && kdata && kdata.length > 1
    ? ((last.close - kdata[0].close) / kdata[0].close * 100) : 0

  return (
    <div className="px-4 pb-3">
      <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5">
        <div className="mb-3">
          <div className="text-sm font-semibold text-[#F0F2F5]">{symbol} · {name}</div>
          {hasData ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-[#F0F2F5]">{priceData.formattedPrice}</span>
              <span className={`text-[13px] font-medium ${(priceData.change || 0) >= 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                {(priceData.change || 0) >= 0 ? '+' : ''}{(priceData.change || 0).toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="text-xs text-[#4D545C] mt-0.5">暂无数据</div>
          )}
        </div>
        <div className="flex gap-1.5 mb-3">
          {rangeLabels.map(t => (
            <button key={t} onClick={() => setRange(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                range === t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'
              }`}>{t}</button>
          ))}
        </div>
        {loading && (
          <div className="w-full h-[180px] bg-[#0D1117] rounded-md flex items-center justify-center">
            <span className="text-sm text-[#4D545C]">加载中...</span>
          </div>
        )}
        {!loading && !kdata && (
          <div className="w-full h-[180px] bg-[#0D1117] rounded-md flex items-center justify-center">
            <span className="text-sm text-[#4D545C]">暂无 K 线数据</span>
          </div>
        )}
        {kdata && kdata.length > 0 && <CandleChart data={kdata} />}
        <div className="text-[11px] text-[#4D545C] mt-1 mb-1">成交量</div>
        {kdata && <VolChart data={kdata} />}
      </div>
    </div>
  )
}
