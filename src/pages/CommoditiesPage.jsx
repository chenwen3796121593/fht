import { useState, lazy, Suspense } from 'react'
import TopBar from '../components/TopBar'
import MetalsPage from './MetalsPage'

const VipModule = lazy(() => import('./VipPage'))

export default function CommoditiesPage() {
  const [tab, setTab] = useState('metals')

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="commodities" />
      <div className="px-4 pt-2 pb-1 flex gap-1.5 sticky top-[52px] bg-[#0A0F14] z-10">
        <button onClick={() => setTab('metals')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab==='metals' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>贵金属</button>
        <button onClick={() => setTab('vip')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab==='vip' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>VIP</button>
      </div>

      {tab === 'metals' ? <MetalsPage hideTopBar /> : (
        <Suspense fallback={<div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>}>
          <VipModule />
        </Suspense>
      )}
    </div>
  )
}
