import { useState } from 'react'
import TopBar from '../components/TopBar'
import MarketBar, { useMarketQuotes } from '../components/MarketBar'
import Watchlist from '../components/Watchlist'
import StockChart from '../components/StockChart'
import useMarketData from '../hooks/useMarketData'

export default function Dashboard({ onNavigate }) {
  const [selected, setSelected] = useState(() => {
    const saved = localStorage.getItem('fh_selected')
    return saved ? JSON.parse(saved) : { symbol: 'hf_XAU', name: '现货黄金' }
  })
  const [customStocks, setCustomStocks] = useState(() => {
    const saved = localStorage.getItem('fh_custom')
    return saved ? JSON.parse(saved) : []
  })
  const customSymbols = customStocks.map(s => s.symbol)
  const { prices } = useMarketData(customSymbols)
  const quotes = useMarketQuotes()

  const handleSelect = (s) => { setSelected(s); localStorage.setItem('fh_selected', JSON.stringify(s)) }
  const handleAddStock = (s) => {
    setCustomStocks(prev => { const next = [...prev, s]; localStorage.setItem('fh_custom', JSON.stringify(next)); return next })
  }

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="dashboard" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onChat={() => onNavigate('chat')} onNews={() => onNavigate('news')} onAlerts={() => onNavigate('alerts')} />

      <div className="py-3">
        <MarketBar quotes={quotes} />
      </div>

      <Watchlist selected={selected.symbol} onSelect={handleSelect} prices={prices} customStocks={customStocks} onAddStock={handleAddStock} />
      <StockChart symbol={selected.symbol} name={selected.name} priceData={prices[selected.symbol]} />
    </div>
  )
}
