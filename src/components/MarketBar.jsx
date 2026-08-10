import { MARKETBAR_SYMBOLS } from '../lib/constants.js'

export default function MarketBar({ quotes }) {
  return (
    <div className="rail">
      {MARKETBAR_SYMBOLS.map((q) => {
        const d = quotes[q.symbol]
        const up = d && d.change >= 0
        const col = up ? 'var(--up)' : 'var(--down)'
        return (
          <div key={q.symbol} className="panel panel-hover px-3 py-2.5 flex flex-col gap-1">
            <span className="text-[10px] text-[var(--text-2)] truncate">{q.name}</span>
            <span className="text-[14px] font-bold text-[var(--text)] num leading-none">{d && d.rawPrice ? d.formattedPrice : '--'}</span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold num" style={{ color: col }}>
                {d ? (up ? '+' : '') + d.change.toFixed(2) + '%' : '--'}
              </span>
              <span className="text-[10px] num" style={{ color: d && d.point >= 0 ? 'var(--up)' : 'var(--down)' }}>
                {d ? (d.point >= 0 ? '+' : '') + d.point.toFixed(q.symbol === 'nf_M0' ? 0 : 2) : '--'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
