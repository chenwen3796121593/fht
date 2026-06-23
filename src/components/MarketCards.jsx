export default function MarketCards({ cards }) {
  if (!cards || cards.length === 0) {
    return <div className="px-4 pb-2 text-xs text-[#4D545C]">加载中...</div>
  }

  return (
    <div className="px-4 pb-2 pt-1">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {cards.map((idx) => (
          <div
            key={idx.name}
            className="flex-shrink-0 w-[140px] bg-[#12161C] border border-[#242B33] rounded-lg px-3 py-2.5 flex flex-col gap-1"
          >
            <span className="text-[11px] text-[#8D949E]">{idx.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#F0F2F5]">{idx.price}</span>
              <span className={`text-[11px] font-medium ${idx.up ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                {idx.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
