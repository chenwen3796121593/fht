import { useState } from 'react'
import TopBar from '../components/TopBar'
import MarketBar from '../components/MarketBar'
import Watchlist from '../components/Watchlist'
import StockChart from '../components/StockChart'
import { useApp } from '../context/AppContext.jsx'
import { normalizeSymbol } from '../lib/constants.js'

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
    <div className="bg-[var(--bg)] h-full overflow-y-auto scroll-thin">
      <TopBar active="dashboard" />
      <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-3">
        <div className="flex items-end justify-between fade-up">
          <div>
            <div className="eyebrow hidden md:block">Watchlist</div>
            <h1 className="h1 mt-0.5">自选盯盘</h1>
          </div>
          <div className="text-[11px] text-[var(--text-3)] num flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--down)] inline-block animate-pulse" />实时行情
          </div>
        </div>

        <MarketBar quotes={quotes} />

        <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Watchlist embedded selected={selected.symbol} onSelect={handleSelect} prices={prices} customStocks={customStocks} onAddStock={handleAddStock} onRemoveStock={handleRemoveStock} />
          <div className="mt-3 md:mt-0 pb-8">
            <StockChart symbol={selected.symbol} name={selected.name} priceData={quotes[selected.symbol] || prices[selected.symbol]} />
          </div>
        </div>
      </div>
    </div>
  )
}
