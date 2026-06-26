import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { Banknote } from 'lucide-react'

const TABLE1 = ['黄金', '白银', '铂金', '钯金']
const TABLE2 = ['千足金', '18K（黄金）', 'Pt950', 'Pd990', 'Ag925']

export default function MetalsPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchMetals = async () => {
      try {
        const res = await fetch('/api/metals?t=' + Date.now())
        const json = await res.json()
        if (!cancelled && Array.isArray(json)) setData(json)
      } catch(e) {}
    }
    fetchMetals()
    const t = setInterval(fetchMetals, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const get = (name) => data?.find(d => d.name === name) || {}
  const updateTime = data?.[0]?.time || ''

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="metals" />
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Banknote size={18} className="text-[#F59E0B]" />
        <span className="text-sm font-bold text-[#F0F2F5]">贵金属行情</span>
        {updateTime && <span className="text-xs text-[#F59E0B] font-mono ml-2">{updateTime}</span>}
      </div>

      {/* Table 1: 黄金/白银/铂金/钯金 — 3列 */}
      <div className="px-4 pb-6">
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[10px] text-[#4D545C] border-b border-[#242B33] bg-[#0D1117]">
            <span>品种</span><span className="text-right">回购</span><span className="text-right">销售</span>
          </div>
          {TABLE1.map((name, i) => {
            const d = get(name)
            return (
              <div key={name} className={`grid grid-cols-3 gap-2 px-3 py-2.5 items-center ${i % 2 ? 'bg-[#0D1117]' : 'bg-[#12161C]'}`}>
                <span className="text-xs font-medium text-[#F0F2F5]">{name}</span>
                <span className="text-xs font-semibold text-[#EF4444] text-right tabular-nums">{d.buy ? Number(d.buy).toFixed(2) : '--'}</span>
                <span className="text-xs font-semibold text-[#22C55E] text-right tabular-nums">{d.sell ? Number(d.sell).toFixed(2) : '--'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table 2: 饰品回购价 — 2列 */}
      <div className="px-4 pb-8">
        <div className="text-[10px] text-[#6B7280] mb-2 ml-1">饰品回购价</div>
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] text-[#4D545C] border-b border-[#242B33] bg-[#0D1117]">
            <span>品种</span><span className="text-right">回购</span>
          </div>
          {TABLE2.map((name, i) => {
            const d = get(name)
            return (
              <div key={name} className={`grid grid-cols-2 gap-2 px-3 py-2.5 items-center ${i % 2 ? 'bg-[#0D1117]' : 'bg-[#12161C]'}`}>
                <span className="text-xs font-medium text-[#F0F2F5]">{name}</span>
                <span className="text-xs font-semibold text-[#EF4444] text-right tabular-nums">{d.buy ? Number(d.buy).toFixed(2) : '--'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 flex items-center justify-between">
        <div className="text-[10px] text-[#6B7280] leading-relaxed">
          <div>回购黄金/铂金/钯金/银</div>
          <div>湖南省衡阳市</div>
        </div>
        <img src="/qrcode.jpg" alt="微信二维码" className="w-16 h-16 rounded-lg border border-[#242B33] object-cover" />
      </div>
    </div>
  )
}
