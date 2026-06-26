import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { Banknote } from 'lucide-react'

export default function MetalsPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    // Instant cache
    const cached = localStorage.getItem('fh_metals')
    if (cached) { try { const p = JSON.parse(cached); if (p.length) setData(p) } catch {} }

    const fetchMetals = async () => {
      try {
        const res = await fetch('/api/metals?t=' + Date.now())
        const json = await res.json()
        if (!cancelled && Array.isArray(json) && json.length > 0) {
          setData(json)
          localStorage.setItem('fh_metals', JSON.stringify(json))
        }
      } catch(e) {}
    }
    fetchMetals()
    const t = setInterval(fetchMetals, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="metals" />
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Banknote size={18} className="text-[#F59E0B]" />
        <span className="text-sm font-bold text-[#F0F2F5]">贵金属行情</span>
      </div>

      <div className="px-4 pb-4">
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] text-[#4D545C] border-b border-[#242B33] bg-[#0D1117]">
            <span>品种</span><span className="text-right">销售价(元/克)</span>
          </div>
          {(data || [{},{},{},{}]).map((d, i) => (
            <div key={d.name || i} className={`grid grid-cols-2 gap-2 px-3 py-2.5 items-center ${i % 2 ? 'bg-[#0D1117]' : 'bg-[#12161C]'}`}>
              <span className="text-xs font-medium text-[#F0F2F5]">{d.name || '--'}</span>
              <span className="text-xs font-semibold text-[#F59E0B] text-right tabular-nums">{d.price || '--'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 flex items-center justify-center gap-8 pb-6">
        <div className="text-[10px] text-[#6B7280] leading-relaxed text-center">
          <div>回购黄金/铂金/钯金/银</div>
          <div>湖南省衡阳市</div>
        </div>
        <img src="/qrcode.jpg" alt="微信二维码" className="w-14 h-14 rounded-lg border border-[#242B33] object-cover" />
      </div>
    </div>
  )
}
