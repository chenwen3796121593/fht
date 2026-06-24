import { useState } from 'react'
import TopBar from '../components/TopBar'
import MarketBar, { useMarketQuotes } from '../components/MarketBar'
import Watchlist from '../components/Watchlist'
import StockChart from '../components/StockChart'
import useMarketData from '../hooks/useMarketData'
import useAlertChecker from '../hooks/useAlertChecker'

export default function Dashboard({ onNavigate }) {
  const [selected, setSelected] = useState(() => {
    const saved = localStorage.getItem('fh_selected')
    return saved ? JSON.parse(saved) : { symbol: 'hf_XAU', name: '现货黄金' }
  })
  const [customStocks, setCustomStocks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fh_custom') || '[]')
      // Auto-fix old entries without prefix
      let changed = false
      const fixed = (Array.isArray(saved) ? saved : []).map(s => {
        let sym = s?.symbol || ''
        if (sym && !sym.startsWith('sh') && !sym.startsWith('sz') && !sym.startsWith('bj') && !sym.startsWith('hf_') && !sym.startsWith('nf_')) {
          if (sym.startsWith('6')) { sym = 'sh' + sym; changed = true }
          else if (sym.match(/^[03]/)) { sym = 'sz' + sym; changed = true }
        }
        return { ...s, symbol: sym }
      })
      if (changed) { try { localStorage.setItem('fh_custom', JSON.stringify(fixed)) } catch(e) {} }
      return fixed
    } catch(e) { return [] }
  })

  const customSymbols = customStocks.map(s => s.symbol).filter(Boolean)
  const { prices } = useMarketData(customSymbols)
  const quotes = useMarketQuotes()
  useAlertChecker(prices)

  const handleSelect = (s) => { setSelected(s); localStorage.setItem('fh_selected', JSON.stringify(s)) }
  const handleAddStock = (s) => {
    if (!s) return
    setCustomStocks(prev => { const next = [...prev, s]; localStorage.setItem('fh_custom', JSON.stringify(next)); return next })
  }
  const handleRemoveStock = (s) => {
    setCustomStocks(prev => { const next = prev.filter(x => x.symbol !== s.symbol); localStorage.setItem('fh_custom', JSON.stringify(next)); return next })
  }

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="dashboard" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onChat={() => onNavigate('chat')} onNews={() => onNavigate('news')} onAlerts={() => onNavigate('alerts')} />

      <div className="pt-3">
        <MarketBar quotes={quotes} />
      </div>

      <Watchlist selected={selected.symbol} onSelect={handleSelect} prices={prices} customStocks={customStocks} onAddStock={handleAddStock} onRemoveStock={handleRemoveStock} />
      <StockChart symbol={selected.symbol} name={selected.name} priceData={quotes[selected.symbol] || prices[selected.symbol]} />
    </div>
  )
}
