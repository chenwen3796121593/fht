import { useState, useEffect, useCallback } from 'react'
import { POLL_INTERVAL, DEFAULT_SYMBOLS, MARKETBAR_SYMBOLS, normalizeSymbol } from '../lib/constants.js'

const PROXY_URL = '/api/data?list='

function fmtPrice(symbol, price) {
  if (!price) return '--'
  if (symbol.startsWith('sh') || symbol.startsWith('sz') || symbol.startsWith('bj')) return price.toFixed(2)
  if (symbol === 'hf_XAU' || symbol === 'hf_HG' || symbol === 'hf_AHD') return price.toFixed(1)
  if (symbol === 'nf_M0') return price.toFixed(0)
  return price.toFixed(2)
}

function parseData(symbol, name, type, parts) {
  // Index / Stock: [0]name, [1]open, [2]prevClose, [3]current
  if ((type === 'index' || type === 'stock') && parts.length > 5) {
    const price = parseFloat(parts[3]) || 0
    const prevClose = parseFloat(parts[2]) || price
    const open = parseFloat(parts[1]) || price
    const high = parseFloat(parts[4]) || price
    const low = parseFloat(parts[5]) || price
    const turnover = parseFloat(parts[9]) || 0
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
    // Sina name fix: strip XD/XR/DR, prefer stored name if it looks real
    let sinaName = (parts[0] || '').replace(/^(XD|XR|DR)/, '').trim()
    if (/^(sh|sz|bj|hf_|nf_)\d+/.test(sinaName)) sinaName = ''
    const storedIsReal = name && !/^(sh|sz|bj|hf_|nf_)\d+/.test(name) && /[一-鿿]/.test(name)
    return {
      name: storedIsReal ? name : (sinaName || name),
      price, formattedPrice: fmtPrice(symbol, price), prevClose,
      open, high, low, turnover, change,
      point: price - prevClose, rawPrice: price,
    }
  }
  // Domestic futures: [5]=prevClose, [6]=current
  if (symbol.startsWith('nf_') && parts.length > 6) {
    const price = parseFloat(parts[6]) || 0
    const prevClose = parseFloat(parts[5]) || price
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
    return { name, price, formattedPrice: fmtPrice(symbol, price), prevClose, open: price, high: price, low: price, turnover: 0, change, point: price - prevClose, rawPrice: price }
  }
  // Commodity: current at [0], prev close at [7]
  if (type === 'commodity' && parts.length > 7) {
    const price = parseFloat(parts[0]) || 0
    const prevClose = parseFloat(parts[7]) || price
    const open = parseFloat(parts[1]) || price
    const high = parseFloat(parts[4]) || price
    const low = parseFloat(parts[5]) || price
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
    return { name, price, formattedPrice: fmtPrice(symbol, price), prevClose, open, high, low, turnover: 0, change, point: price - prevClose, rawPrice: price }
  }
  return null
}

export default function useMarketData(extraSymbols = []) {
  const [prices, setPrices] = useState({})
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const baseSymbols = DEFAULT_SYMBOLS.map(m => m.symbol)
    const extraSyms = extraSymbols.map(s => typeof s === 'string' ? s : s.symbol).filter(Boolean)
    const allSymbols = [...baseSymbols, ...extraSyms.filter(s => !baseSymbols.includes(s))]
    const symbolsStr = allSymbols.join(',')

    try {
      const res = await fetch(PROXY_URL + symbolsStr + '&t=' + Date.now())
      const json = await res.json()
      const text = json.data || ''
      const lines = text.split('\n').filter(l => l.trim())

      const extraItems = extraSymbols.map(s => {
        const sym = normalizeSymbol(typeof s === 'string' ? s : s.symbol)
        const storedName = typeof s === 'string' ? s : (s.name || s.symbol)
        return { symbol: sym, name: storedName, type: 'stock' }
      })
      const allItems = [...DEFAULT_SYMBOLS, ...extraItems]

      const pricesResult = {}
      const quotesResult = {}

      for (const item of allItems) {
        const line = lines.find(l => l.includes(item.symbol))
        if (!line) continue
        const content = line.replace(/^var hq_str_\w+="?/, '').replace(/";?\s*$/, '')
        if (!content || content === '""') continue
        const parts = content.split(',')
        const parsed = parseData(item.symbol, item.name, item.type, parts)
        if (!parsed || parsed.price <= 0) continue
        pricesResult[item.symbol] = parsed
      }

      for (const q of MARKETBAR_SYMBOLS) {
        quotesResult[q.symbol] = pricesResult[q.symbol] || null
      }

      if (Object.keys(pricesResult).length > 0) {
        setPrices(pricesResult)
        setQuotes(quotesResult)
        setLoading(false)
      }
    } catch (e) {
      console.error('Market fetch error:', e)
      setLoading(false)
    }
  }, [extraSymbols.map(s => typeof s === 'string' ? s : s.symbol).join(',')])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [fetchAll])

  const marketCards = DEFAULT_SYMBOLS.map(m => {
    const d = prices[m.symbol]
    if (!d || !d.price) return { name: m.name, price: '--', change: '0.00%', up: true, loading: true }
    const c = d.change || 0
    return { name: d.name || m.name, price: d.formattedPrice, change: (c >= 0 ? '+' : '') + c.toFixed(2) + '%', up: c >= 0, loading: false }
  })

  return { prices, quotes, marketCards, loading }
}
