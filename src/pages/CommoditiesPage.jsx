import { useState, lazy, Suspense } from 'react'
import TopBar from '../components/TopBar'
import MetalsPage from './MetalsPage'

const VipModule = lazy(() => import('./VipPage'))

export default function CommoditiesPage() {
  const [tab, setTab] = useState('metals')

  return (
    <div className="bg-[var(--bg)] h-full overflow-y-auto scroll-thin">
      <TopBar active="commodities" />
      <div className="px-4 md:px-6">
        <div className="py-3 md:py-4 flex items-end justify-between fade-up">
          <div>
            <div className="eyebrow hidden md:block">Commodities</div>
            <h1 className="h1 mt-0.5">大宗商品</h1>
          </div>
        </div>
        <div className="flex gap-1.5 sticky top-[57px] md:top-0 bg-[var(--bg)]/90 backdrop-blur z-10 px-4 md:px-6 pt-2 pb-2 -mx-4 md:-mx-6">
          <button onClick={() => setTab('metals')} className={`chip ${tab==='metals' ? 'chip-active' : ''}`}>贵金属</button>
          <button onClick={() => setTab('vip')} className={`chip ${tab==='vip' ? 'chip-active' : ''}`}>VIP</button>
        </div>

        {tab === 'metals' ? <MetalsPage hideTopBar /> : (
          <Suspense fallback={<div className="text-center text-[var(--text-3)] text-sm py-12">加载中...</div>}>
            <VipModule />
          </Suspense>
        )}
      </div>
    </div>
  )
}
