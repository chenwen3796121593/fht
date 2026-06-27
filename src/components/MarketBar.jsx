import { MARKETBAR_SYMBOLS } from '../lib/constants.js'

export default function MarketBar({ quotes }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {MARKETBAR_SYMBOLS.map((q) => {
        const d = quotes[q.symbol]
        return (
          <div key={q.symbol} className="flex-shrink-0 w-[140px] bg-[#12161C] border border-[#242B33] rounded-xl px-3 py-2.5 flex flex-col gap-1">
            <span className="text-[10px] text-[#8D949E]">{q.name}</span>
            <span className="text-[13px] font-bold text-[#F0F2F5]">{d && d.rawPrice ? d.formattedPrice : '--'}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium" style={{ color: d && d.change >= 0 ? '#EF4444' : '#22C55E' }}>
                {d ? (d.change >= 0 ? '+' : '') + d.change.toFixed(2) + '%' : '--'}
              </span>
              <span className="text-[10px]" style={{ color: d && d.point >= 0 ? '#EF4444' : '#22C55E' }}>
                {d ? (d.point >= 0 ? '+' : '') + d.point.toFixed(q.symbol === 'nf_M0' ? 0 : 2) : '--'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
