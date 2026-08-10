import { useState, lazy, Suspense } from 'react'
import MetalsPage from './MetalsPage'

const VipModule = lazy(() => import('./VipPage'))

export default function CommoditiesPage() {
  const [tab, setTab] = useState('metals')

  return (
    <div className="page-scroll scroll-thin">
      <div className="content">
        <div className="flex items-end justify-between fade-up pt-1">
          <div>
            <div className="eyebrow hidden md:block">Commodities</div>
            <h1 className="h1 mt-0.5">黄金</h1>
          </div>
        </div>
        <div className="subtabs">
          <button onClick={() => setTab('metals')} className={`chip ${tab==='metals' ? 'chip-active' : ''}`}>贵金属</button>
          <button onClick={() => setTab('vip')} className={`chip ${tab==='vip' ? 'chip-active' : ''}`}>VIP</button>
        </div>

        {tab === 'metals' ? <MetalsPage /> : (
          <Suspense fallback={<div className="text-center text-[var(--text-3)] text-sm py-12">加载中...</div>}>
            <VipModule />
          </Suspense>
        )}
      </div>
    </div>
  )
}
