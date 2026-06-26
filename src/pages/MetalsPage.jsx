import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar'
import { Banknote } from 'lucide-react'

const SB_URL = 'https://apfdgetfqxgbplariowa.supabase.co'
const SB_KEY = 'sb_publishable_rb8wBIRHHXMOYSjDs8-LIQ_7jTR2B5o'

export default function MetalsPage() {
  const [data, setData] = useState(null)
  const [rankings, setRankings] = useState([])
  const sbRef = useRef(null)

  // ---- Sina metals prices ----
  useEffect(() => {
    let cancelled = false
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

  // ---- Supabase commodity_rankings with real-time ----
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { createClient } = await import('@supabase/supabase-js')
      if (cancelled) return
      const sb = createClient(SB_URL, SB_KEY)
      sbRef.current = sb

      // Initial fetch
      const { data: rows } = await sb.from('commodity_rankings').select('*').order('id')
      if (!cancelled && rows) setRankings(rows)

      // Real-time subscription
      sb.channel('rankings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commodity_rankings' }, () => {
          sb.from('commodity_rankings').select('*').order('id').then(({ data: fresh }) => {
            if (fresh) setRankings(fresh)
          })
        }).subscribe()
    })()
    return () => { cancelled = true; try { sbRef.current?.removeAllChannels() } catch {} }
  }, [])

  // Pivot: group by name
  const names = [...new Set(rankings.map(r => r.name))]
  const getTarget = (name, horizon) => {
    const r = rankings.find(x => x.name === name && x.horizon === horizon)
    if (!r) return { val: '--', up: false }
    const up = r.target > r.current
    return { val: (up ? '+' : '') + r.target.toFixed(1), up }
  }

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="metals" />
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Banknote size={18} className="text-[#F59E0B]" />
        <span className="text-sm font-bold text-[#F0F2F5]">贵金属行情</span>
      </div>

      {/* Sina metals table */}
      <div className="px-4 pb-6">
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

      {/* Commodity forecast table */}
      {names.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <span className="text-xs font-semibold text-[#F0F2F5]">商品预测</span>
            {rankings[0]?.updated && (
              <span className="text-[9px] text-[#4D545C]">
                {new Date(rankings[0].updated).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
              </span>
            )}
          </div>
          <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-1 px-2 py-2 text-[9px] text-[#4D545C] border-b border-[#242B33] bg-[#0D1117]">
              <span>品种</span><span className="text-right">现价</span><span className="text-right">7天</span><span className="text-right">14天</span><span className="text-right">30天</span>
            </div>
            {names.map((name, i) => {
              const r = rankings.find(x => x.name === name)
              return (
                <div key={name} className={`grid grid-cols-5 gap-1 px-2 py-2.5 items-center ${i % 2 ? 'bg-[#0D1117]' : 'bg-[#12161C]'}`}>
                  <span className="text-[10px] font-medium text-[#F0F2F5] truncate">{name}</span>
                  <span className="text-[10px] text-[#F0F2F5] text-right tabular-nums">{r ? r.current.toFixed(1) : '--'}</span>
                  {(() => { const t = getTarget(name, '7d'); return <span className="text-[10px] text-right tabular-nums" style={{ color: t.up ? '#EF4444' : '#22C55E' }}>{t.val}</span> })()}
                  {(() => { const t = getTarget(name, '14d'); return <span className="text-[10px] text-right tabular-nums" style={{ color: t.up ? '#EF4444' : '#22C55E' }}>{t.val}</span> })()}
                  {(() => { const t = getTarget(name, '30d'); return <span className="text-[10px] text-right tabular-nums" style={{ color: t.up ? '#EF4444' : '#22C55E' }}>{t.val}</span> })()}
                </div>
              )
            })}
          </div>
          <div className="text-[9px] text-[#4D545C] mt-2 text-center">免责声明：AI预测基于历史统计规律，不构成投资建议。</div>
        </div>
      )}

      {/* Footer */}
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
