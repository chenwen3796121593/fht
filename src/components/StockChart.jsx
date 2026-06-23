import { useState, useMemo } from 'react'

const ranges = { '1日': 24, '1周': 7, '1月': 30, '3月': 90, '1年': 252, '全部': 365 }

// Estimate base price from symbol name
function getBasePrice(symbol) {
  if (symbol.includes('XAU') || symbol.includes('GC')) return 2600
  if (symbol.includes('XAG') || symbol.includes('SI')) return 31
  if (symbol.includes('CL')) return 85
  if (symbol.includes('HG') || symbol.includes('CU')) return 4.5
  if (symbol.includes('_S') || symbol.includes('豆')) return 1150
  if (symbol.startsWith('sh') || symbol.startsWith('sz')) return 4000
  if (symbol.length <= 6 && !symbol.includes('=')) return 100
  return 100
}

function generateData(days, symbol) {
  const data = []
  let price = getBasePrice(symbol)
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * (price * 0.02)
    const open = price
    const close = open + change
    const high = Math.max(open, close) + Math.random() * (price * 0.01)
    const low = Math.min(open, close) - Math.random() * (price * 0.01)
    data.push({ open, close, high, low, volume: Math.round(Math.random() * 50000000 + 10000000) })
    price = close
  }
  return data
}

function formatPrice(v, symbol) {
  if (symbol.includes('XAU') || symbol.includes('GC')) return '$' + v.toFixed(1)
  if (symbol.startsWith('sh') || symbol.startsWith('sz')) return v.toFixed(2)
  if (symbol.includes('_S')) return v.toFixed(2)
  if (v >= 1000) return v.toFixed(0)
  return '$' + v.toFixed(2)
}

function CandleChart({ data, width = 310, height = 180 }) {
  const p = { top: 10, right: 8, bottom: 20, left: 52 }
  const cw = width - p.left - p.right
  const ch = height - p.top - p.bottom
  const all = data.flatMap((d) => [d.high, d.low])
  const lo = Math.min(...all), hi = Math.max(...all)
  const range = hi - lo || 1
  const toY = (v) => p.top + ((hi - v) / range) * ch
  const barW = Math.max(1, (cw / data.length) * 0.7)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#0D1117" rx={6} />
      {[0, 1, 2, 3, 4].map((i) => {
        const v = lo + (range / 4) * i, y = toY(v)
        return (
          <g key={i}>
            <line x1={p.left} y1={y} x2={width - p.right} y2={y} stroke="#1A2129" strokeWidth={0.5} />
            <text x={p.left - 5} y={y + 4} fill="#4D545C" fontSize={9} textAnchor="end">{v.toFixed(v >= 100 ? 0 : 2)}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = p.left + i * (cw / data.length)
        const up = d.close >= d.open, color = up ? '#EF4444' : '#22C55E'
        const y1 = toY(Math.max(d.open, d.close)), y2 = toY(Math.min(d.open, d.close))
        const h = Math.max(1, y2 - y1), cx = x + barW / 2
        return (
          <g key={i}>
            <line x1={cx} y1={toY(d.high)} x2={cx} y2={toY(d.low)} stroke={color} strokeWidth={1} />
            <rect x={x + (cw / data.length - barW) / 2} y={y1} width={barW} height={h} fill={color} />
          </g>
        )
      })}
    </svg>
  )
}

function VolChart({ data, width = 310, height = 44 }) {
  const maxV = Math.max(...data.map((d) => d.volume))
  const barW = Math.max(1, (width - 16) / data.length * 0.7)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#0D1117" rx={4} />
      {data.map((d, i) => {
        const h = Math.max(2, (d.volume / maxV) * (height - 8)), up = d.close >= d.open
        return (
          <rect key={i} x={8 + i * ((width - 16) / data.length) + ((width - 16) / data.length - barW) / 2}
            y={height - h} width={barW} height={h}
            fill={up ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'} />
        )
      })}
    </svg>
  )
}

export default function StockChart({ symbol, name, priceData }) {
  const [range, setRange] = useState('1周')
  const data = useMemo(() => generateData(ranges[range], symbol), [range, symbol])
  const last = data[data.length - 1]
  const hasData = !!priceData
  const prev = data[data.length - 2]
  const change = prev && last ? ((last.close - prev.close) / prev.close * 100) : 0
  const price = formatPrice(last.close, symbol)

  return (
    <div className="px-4 pb-3">
      <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5">
        <div className="mb-3">
          <div className="text-sm font-semibold text-[#F0F2F5]">{symbol} · {name}</div>
          {hasData ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-[#F0F2F5]">{priceData.formattedPrice}</span>
              <span className={`text-[13px] font-medium ${(priceData.change||0) >= 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                {(priceData.change||0) >= 0 ? '+' : ''}{(priceData.change||0).toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="text-xs text-[#4D545C] mt-0.5">暂无数据，请输入正确的股票代码</div>
          )}
        </div>
        <div className="flex gap-1.5 mb-3">
          {Object.keys(ranges).map((t) => (
            <button key={t} onClick={() => setRange(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                range === t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'
              }`}>{t}</button>
          ))}
        </div>
        <CandleChart data={data} />
        <div className="text-[11px] text-[#4D545C] mt-1 mb-1">成交量</div>
        <VolChart data={data} />
      </div>
    </div>
  )
}
