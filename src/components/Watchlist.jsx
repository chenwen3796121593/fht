import { useState } from 'react'

const NAME_MAP = {
  '茅台': 'sh600519', '贵州茅台': 'sh600519',
  '平安': 'sh601318', '中国平安': 'sh601318',
  '比亚迪': 'sz002594', '宁德时代': 'sz300750',
  '五粮液': 'sz000858', '招商银行': 'sh600036',
  '中信证券': 'sh600030', '万科': 'sz000002',
  '格力': 'sz000651', '美的': 'sz000333',
  '恒瑞医药': 'sh600276', '伊利': 'sh600887',
  '隆基': 'sh601012', '中芯国际': 'sh688981',
}

const WATCH_ITEMS = [
  { symbol: 'hf_XAU', name: '现货黄金' },
  { symbol: 'hf_XAG', name: '现货白银' },
  { symbol: 'hf_CL', name: '国际原油' },
  { symbol: 'hf_HG', name: 'COMEX铜' },
  { symbol: 'hf_AHD', name: 'LME铝' },
  { symbol: 'nf_M0', name: '豆粕' },
]

export default function Watchlist({ selected, onSelect, prices = {}, customStocks = [], onAddStock }) {
  const [showAdd, setShowAdd] = useState(false)
  const [code, setCode] = useState('')

  const addStock = () => {
    const input = code.trim()
    if (!input) return
    const mapped = NAME_MAP[input]
    const symbol = mapped || input
    const name = mapped ? (Object.keys(NAME_MAP).find(k => NAME_MAP[k] === mapped) || input) : input
    if (!WATCH_ITEMS.find(s => s.symbol === symbol) && !customStocks.find(s => s.symbol === symbol)) {
      onAddStock({ symbol, name })
    }
    setCode('')
    setShowAdd(false)
  }

  const all = [...WATCH_ITEMS, ...customStocks]

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#F0F2F5]">自选</span>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs font-medium text-[#3B82F6]">+ 添加</button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-1.5 text-xs text-[#F0F2F5] outline-none placeholder:text-[#4D545C]"
            placeholder="输入代码或名称，如 sh600519、茅台"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStock()}
          />
          <button onClick={addStock} className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs rounded-md font-medium">确认</button>
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-h-[232px] overflow-y-auto scrollbar-hide">
        {all.map((s) => {
          const d = prices[s.symbol]
          let priceStr = '--', changeStr = '--', up = true
          if (d && d.price > 0) {
            const c = d.change || 0
            priceStr = d.formattedPrice
            changeStr = (c >= 0 ? '+' : '') + c.toFixed(2) + '%'
            up = c >= 0
          }
          return (
            <button
              key={s.symbol}
              onClick={() => onSelect({ symbol: s.symbol, name: s.name })}
              className={`flex items-center rounded-lg px-3 py-2 text-left transition-colors ${
                selected === s.symbol ? 'bg-[#1A2A3F] ring-1 ring-[#3B82F6]' : 'bg-[#12161C]'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-[#F0F2F5]">{d?.name || s.name}</span>
                <span className="text-[11px] text-[#8D949E]">{s.symbol}</span>
              </div>
              <div className="flex-1" />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[13px] font-semibold text-[#F0F2F5]">{priceStr}</span>
                <span className={`text-[11px] font-medium ${up ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                  {changeStr}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
