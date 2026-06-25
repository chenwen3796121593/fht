import { useState, useEffect } from 'react'

const ITEMS = [
  { symbol: 'sh000001', name: '上证指数' },
  { symbol: 'sz399001', name: '深证成指' },
  { symbol: 'hf_XAU', name: '现货黄金' },
  { symbol: 'hf_XAG', name: '现货白银' },
  { symbol: 'hf_CL', name: '国际原油' },
  { symbol: 'hf_HG', name: 'COMEX铜' },
  { symbol: 'hf_AHD', name: 'LME铝' },
]

export function useMarketQuotes() {
  const [quotes, setQuotes] = useState({})
  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      try {
        const syms = ITEMS.map(q => q.symbol).join(',')
        const res = await fetch('/api/data?list=' + syms + '&t=' + Date.now())
        const json = await res.json()
        const lines = (json.data || '').split('\n').filter(l => l.trim())
        const result = {}
        if (lines.length < 2) return // API failed, keep old data
        for (const q of ITEMS) {
          const line = lines.find(l => l.includes(q.symbol))
          if (!line) continue
          const s = line.replace(/^var hq_str_\w+="?/, '').replace(/";?\s*$/, '').split(',')
          let price, change, prev, isIndex = false
          if (q.symbol.startsWith('sh') || q.symbol.startsWith('sz')) {
            price = parseFloat(s[3]); prev = parseFloat(s[2]); isIndex = true
          } else if (q.symbol.startsWith('nf_')) {
            price = parseFloat(s[6]); prev = parseFloat(s[5]) || price
          } else {
            price = parseFloat(s[0]); prev = parseFloat(s[7])
          }
          change = prev ? ((price - prev) / prev * 100) : 0
          let turnover = 0
          if (isIndex) { turnover = parseFloat(s[9]) || 0 }
          let open = price, high = price, low = price
          if (isIndex) {
            open = parseFloat(s[1]) || price; high = parseFloat(s[4]) || price; low = parseFloat(s[5]) || price
          } else if (!q.symbol.startsWith('nf_')) {
            open = parseFloat(s[1]) || price; high = parseFloat(s[4]) || price; low = parseFloat(s[5]) || price
          }
          result[q.symbol] = {
            price: isIndex ? price.toFixed(2) : (q.symbol === 'hf_XAU' ? price.toFixed(1) : q.symbol === 'nf_M0' ? price.toFixed(0) : price.toFixed(2)),
            change, point: (price - prev).toFixed(q.symbol === 'nf_M0' ? 0 : 2), turnover,
            open, high, low, rawPrice: price
          }
        }
        if (!cancelled) setQuotes(result)
      } catch(e) {}
    }
    fetchAll()
    const t = setInterval(fetchAll, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])
  return quotes
}

export default function MarketBar({ quotes }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {ITEMS.map((q) => {
        const d = quotes ? quotes[q.symbol] : null
        return (
          <div key={q.symbol} className="flex-shrink-0 w-[140px] bg-[#12161C] border border-[#242B33] rounded-xl px-3 py-2.5 flex flex-col gap-1">
            <span className="text-[10px] text-[#8D949E]">{q.name}</span>
            <span className="text-[13px] font-bold text-[#F0F2F5]">{d ? d.price : '--'}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium" style={{ color: d && d.change >= 0 ? '#EF4444' : '#22C55E' }}>
                {d ? (d.change >= 0 ? '+' : '') + d.change.toFixed(2) + '%' : '--'}
              </span>
              <span className="text-[10px]" style={{ color: d && d.point >= 0 ? '#EF4444' : '#22C55E' }}>
                {d ? (d.point >= 0 ? '+' : '') + d.point : '--'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
