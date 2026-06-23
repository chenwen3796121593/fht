import { useState, useEffect, useCallback } from 'react'

const PROXY_URL = '/api/data?list='

const MARKET_ITEMS = [
  { symbol: 'sh000001', name: '上证指数', type: 'index' },
  { symbol: 'sz399001', name: '深证成指', type: 'index' },
  { symbol: 'hf_XAU', name: '现货黄金', type: 'commodity' },
  { symbol: 'hf_XAG', name: '现货白银', type: 'commodity' },
  { symbol: 'hf_CL', name: '国际原油', type: 'commodity' },
  { symbol: 'hf_HG', name: 'COMEX铜', type: 'commodity' },
]

function parseSina(data, item) {
  const content = data.replace(/^var hq_str_\w+="?/, '').replace(/";?\s*$/, '')
  if (!content || content === '""') return null
  const parts = content.split(',')

  // Stock format is same as index: [0]name, [1]open, [2]prevClose, [3]current
  if ((item.type === 'index' || item.type === 'stock') && parts.length > 5) {
    return {
      name: parts[0],
      price: parseFloat(parts[3]) || 0,       // parts[3] = current
      prevClose: parseFloat(parts[2]) || 0,   // parts[2] = previous close
    }
  }

  // Commodity: current at [0], prev close at [7]
  if (item.type === 'commodity' && parts.length > 7) {
    const price = parseFloat(parts[0]) || 0
    const prevClose = parseFloat(parts[7]) || price
    return {
      name: item.name,
      price,
      prevClose,
      high: parseFloat(parts[4]) || 0,
      low: parseFloat(parts[5]) || 0,
    }
  }

  return null
}

function fmtPrice(symbol, price) {
  if (!price) return '--'
  // Index: remove decimals
  if (symbol.startsWith('sh') || symbol.startsWith('sz')) return price.toFixed(2)
  // Gold: 4 digits
  if (symbol === 'hf_XAU') return '$' + price.toFixed(1)
  // Silver: 2 digits
  if (symbol === 'hf_XAG') return '$' + price.toFixed(2)
  // Crude: 2 digits
  if (symbol === 'hf_CL') return '$' + price.toFixed(2)
  // Copper: show as-is
  if (symbol === 'hf_HG') return '$' + price.toFixed(2)
  // Soybean
  if (symbol === 'hf_S') return price.toFixed(2)
  return '$' + price.toFixed(2)
}

export default function useMarketData(extraSymbols = []) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const base = MARKET_ITEMS.map((m) => m.symbol)
    const all = [...base, ...extraSymbols.filter(s => !base.includes(s))]
    const symbols = all.join(',')
    try {
      const res = await fetch(PROXY_URL + symbols)
      const json = await res.json()
      const text = json.data || ''
      const lines = text.split('\n').filter((l) => l.trim())

      const result = {}
      // Process all items
      const allItems = [...MARKET_ITEMS, ...extraSymbols.map(s => ({ symbol: s, name: s, type: 'stock' }))]
      for (const item of allItems) {
        const line = lines.find((l) => l.includes(item.symbol))
        if (!line) continue
        const parsed = parseSina(line, item)
        if (parsed && parsed.price > 0) {
          const prev = parsed.prevClose || parsed.price
          const change = prev ? ((parsed.price - prev) / prev) * 100 : 0

          result[item.symbol] = {
            name: parsed.name || item.name,
            price: parsed.price,
            formattedPrice: fmtPrice(item.symbol, parsed.price),
            change,
            prevClose: prev,
          }
        }
      }
      setPrices(result)
      setLoading(false)
    } catch (e) {
      console.error('Fetch error:', e)
      setLoading(false)
    }
  }, [extraSymbols.join(',')])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [fetchAll])

  const marketCards = MARKET_ITEMS.map((m) => {
    const d = prices[m.symbol]
    if (!d) return { name: m.name, price: '--', change: '0.00%', up: true, loading: true }
    const c = d.change || 0
    return {
      name: d.name || m.name,
      price: d.formattedPrice,
      change: (c >= 0 ? '+' : '') + c.toFixed(2) + '%',
      up: c >= 0,
      loading: false,
    }
  })

  return { prices, marketCards, loading }
}
