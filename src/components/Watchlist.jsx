import { useState } from 'react'
import { X } from 'lucide-react'

const NAME_MAP = {
  '茅台': 'sh600519', '贵州茅台': 'sh600519',
  '平安': 'sh601318', '中国平安': 'sh601318',
  '比亚迪': 'sz002594', '宁德': 'sz300750', '宁德时代': 'sz300750',
  '五粮液': 'sz000858', '招商': 'sh600036', '招商银行': 'sh600036',
  '中信': 'sh600030', '中信证券': 'sh600030',
  '万科': 'sz000002',
  '格力': 'sz000651', '美的': 'sz000333',
  '恒瑞': 'sh600276', '恒瑞医药': 'sh600276',
  '伊利': 'sh600887',
  '隆基': 'sh601012',
  '中芯': 'sh688981', '中芯国际': 'sh688981',
  '爱尔': 'sz300015', '爱尔眼科': 'sz300015',
  '药明': 'sh603259', '药明康德': 'sh603259',
  '海康': 'sz002415', '海康威视': 'sz002415',
  '京东方': 'sz000725',
  '立讯': 'sz002475', '立讯精密': 'sz002475',
  '迈瑞': 'sz300760', '迈瑞医疗': 'sz300760',
  '中免': 'sh601888', '中国中免': 'sh601888',
  '紫金': 'sh601899', '紫金矿业': 'sh601899',
  '北方稀土': 'sh600111',
  '长城汽车': 'sh601633',
  '中国神华': 'sh601088',
  '工商银行': 'sh601398', '建设银行': 'sh601939',
  '农业银行': 'sh601288',
  '中国石油': 'sh601857',
  '中国人寿': 'sh601628',
  '兴业银行': 'sh601166',
  '交通银行': 'sh601328',
  '海螺水泥': 'sh600585',
  '长江电力': 'sh600900',
  '三一重工': 'sh600031',
}

const WATCH_ITEMS = [
  { symbol: 'hf_XAU', name: '现货黄金' },
  { symbol: 'hf_XAG', name: '现货白银' },
  { symbol: 'hf_CL', name: '国际原油' },
  { symbol: 'hf_HG', name: 'COMEX铜' },
  { symbol: 'hf_AHD', name: 'LME铝' },
]

export default function Watchlist({ selected, onSelect, prices = {}, customStocks = [], onAddStock, onRemoveStock }) {
  const [showAdd, setShowAdd] = useState(false)
  const [code, setCode] = useState('')

  const [searching, setSearching] = useState(false)
  const addStock = async () => {
    const input = code.trim()
    if (!input || searching) return
    setSearching(true)

    let symbol = NAME_MAP[input] || input
    let name = input

    // Try prefix auto-fix
    if (!symbol.startsWith('sh') && !symbol.startsWith('sz') && !symbol.startsWith('bj') && !symbol.startsWith('hf_') && !symbol.startsWith('nf_')) {
      if (/^[0-9]/.test(symbol)) {
        if (symbol.startsWith('6')) symbol = 'sh' + symbol
        else if (symbol.startsWith('0') || symbol.startsWith('3')) symbol = 'sz' + symbol
        else if (symbol.startsWith('8') || symbol.startsWith('4')) symbol = 'bj' + symbol
      } else {
        // Search via CF Worker
        try {
          const res = await fetch('/api/search?q=' + encodeURIComponent(input))
          const json = await res.json()
          if (json.code) { symbol = json.code; name = input }
        } catch(e) {}
      }
    }

    if (NAME_MAP[input]) name = Object.keys(NAME_MAP).find(k => NAME_MAP[k] === symbol) || input
    const valid = symbol && (symbol.startsWith('sh') || symbol.startsWith('sz') || symbol.startsWith('bj') || symbol.startsWith('hf_') || symbol.startsWith('nf_'))
    if (valid && !WATCH_ITEMS.find(s => s.symbol === symbol) && !customStocks.find(s => s.symbol === symbol)) {
      onAddStock({ symbol, name })
    } else if (!valid) {
      alert('未找到"' + input + '"，请检查名称或输入代码（如 sh600519）')
    }
    setCode('')
    setShowAdd(false)
    setSearching(false)
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
              {customStocks.find(cs => cs.symbol === s.symbol) && (
                <button onClick={e => { e.stopPropagation(); e.preventDefault(); onRemoveStock?.(s) }} className="ml-1 text-[#4D545C] hover:text-red-400"><X size={14} /></button>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
