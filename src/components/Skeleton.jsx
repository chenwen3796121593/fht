// Reusable skeleton loading components with pulse animation

function Shimmer({ className = '' }) {
  return <div className={`bg-[#1A2129] rounded animate-pulse ${className}`} />
}

// Simulates a market card in the MarketBar row
export function SkeletonMarketCards({ count = 7 }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] bg-[#12161C] border border-[#242B33] rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// Simulates the StockChart area
export function SkeletonChart() {
  return (
    <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5">
      <Shimmer className="h-5 w-32 mb-2" />
      <Shimmer className="h-6 w-24 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <Shimmer className="h-6 w-14 rounded" />
        <Shimmer className="h-6 w-14 rounded" />
        <Shimmer className="h-6 w-14 rounded" />
      </div>
      <Shimmer className="h-[180px] w-full rounded-md mb-1" />
      <Shimmer className="h-3 w-10 mb-1" />
      <Shimmer className="h-[44px] w-full rounded-md" />
    </div>
  )
}

// Simulates a list of items (watchlist)
export function SkeletonList({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-[#12161C] rounded-lg px-3 py-2 flex items-center">
          <div className="flex flex-col gap-1">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-3 w-14" />
          </div>
          <div className="flex-1" />
          <div className="flex flex-col items-end gap-1">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Simulates a news card list
export function SkeletonNews({ count = 5 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#12161C] rounded-lg p-3.5">
          <Shimmer className="h-4 w-3/4 mb-2" />
          <Shimmer className="h-3 w-full mb-1" />
          <Shimmer className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// HomePage stats cards
export function SkeletonHomeStats() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2].map(i => (
        <div key={i} className="bg-[#12161C] border border-[#242B33] rounded-xl p-3">
          <Shimmer className="h-3 w-16 mb-1.5" />
          <Shimmer className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}
