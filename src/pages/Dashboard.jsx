import { useState } from 'react'
import TopBar from '../components/TopBar'
import MarketBar from '../components/MarketBar'
import Watchlist from '../components/Watchlist'
import StockChart from '../components/StockChart'
import { useApp } from '../context/AppContext.jsx'
import { normalizeSymbol } from '../lib/constants.js'
import useAlertChecker from '../hooks/useAlertChecker'

export default function Dashboard() {
  const { prices, quotes, addExtraSymbol } = useApp()
  const [selected, setSelected] = useState(() => {
    try {
      const saved = localStorage.getItem('fh_selected')
      return saved ? JSON.parse(saved) : { symbol: 'hf_XAU', name: '现货黄金' }
    } catch { return { symbol: 'hf_XAU', name: '现货黄金' } }
  })
  const [customStocks, setCustomStocks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fh_custom') || '[]')
      let changed = false
      const fixed = (Array.isArray(saved) ? saved : []).map(s => {
        const sym = normalizeSymbol(s?.symbol || '')
        if (sym !== s?.symbol) changed = true
        return { ...s, symbol: sym }
      })
      if (changed) { try { localStorage.setItem('fh_custom', JSON.stringify(fixed)) } catch(e) {} }
      return fixed
    } catch(e) { return [] }
  })

  useAlertChecker(prices)

  const handleSelect = (s) => { setSelected(s); localStorage.setItem('fh_selected', JSON.stringify(s)) }
  const handleAddStock = (s) => {
    if (!s) return
    setCustomStocks(prev => { const next = [...prev, s]; localStorage.setItem('fh_custom', JSON.stringify(next)); return next })
    addExtraSymbol({ symbol: s.symbol, name: s.name })
  }
  const handleRemoveStock = (s) => {
    setCustomStocks(prev => { const next = prev.filter(x => x.symbol !== s.symbol); localStorage.setItem('fh_custom', JSON.stringify(next)); return next })
  }

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="dashboard" />
      <div className="pt-3"><MarketBar quotes={quotes} /></div>
      <Watchlist selected={selected.symbol} onSelect={handleSelect} prices={prices} customStocks={customStocks} onAddStock={handleAddStock} onRemoveStock={handleRemoveStock} />
      <div className="pb-6">
        <StockChart symbol={selected.symbol} name={selected.name} priceData={quotes[selected.symbol] || prices[selected.symbol]} />
      </div>
    </div>
  )
}
