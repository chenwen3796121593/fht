import { useState } from 'react'
import TopBar from '../components/TopBar'
import MarketCards from '../components/MarketCards'
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

  const handleSelect = (s) => {
    setSelected(s)
    localStorage.setItem('fh_selected', JSON.stringify(s))
  }
  const handleAddStock = (s) => {
    setCustomStocks(prev => {
      const next = [...prev, s]
      localStorage.setItem('fh_custom', JSON.stringify(next))
      return next
    })
  }
  const customSymbols = customStocks.map(s => s.symbol)
  const { marketCards, prices } = useMarketData(customSymbols)

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full overflow-x-hidden">
      <TopBar active="dashboard" onHome={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <MarketCards cards={marketCards} />
      <Watchlist
        selected={selected.symbol}
        onSelect={handleSelect}
        prices={prices}
        customStocks={customStocks}
        onAddStock={handleAddStock}
      />
      <StockChart symbol={selected.symbol} name={selected.name} priceData={prices[selected.symbol]} />
    </div>
  )
}
