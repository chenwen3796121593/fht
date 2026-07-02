import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { useApp } from '../context/AppContext.jsx'
import { Banknote, TrendingUp } from 'lucide-react'

const INTL_MAP = {
  '黄金': { code: 'hf_XAU', name: '伦敦黄金' },
  '白银': { code: 'hf_XAG', name: '伦敦白银' },
  '铂金': { code: 'hf_XPT', name: '美铂金' },
  '钯金': { code: 'hf_XPD', name: '美钯金' },
}

export default function MetalsPage() {
  const { prices } = useApp()
  const [data, setData] = useState(null)

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
    const t = setInterval(fetchMetals, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // ---- Moirai-2 商品预测（GitHub每日更新） ----
  const [forecast, setForecast] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchForecast = () => {
      fetch('/api/predict-data?file=moirai_ranking.json&t=' + Date.now())
        .then(r => r.json()).then(d => { if (!cancelled) setForecast(d) })
        .catch(() => {})
    }
    fetchForecast()
    // 每天早上 6:00 自动刷新
    const now = new Date(); const next = new Date(now); next.setHours(6, 0, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    const delay = next - now
    let t2
    const t1 = setTimeout(() => { fetchForecast(); t2 = setInterval(fetchForecast, 86400000) }, delay)
    return () => { cancelled = true; clearTimeout(t1); clearInterval(t2) }
  }, [])

  const fRankings = forecast?.rankings || {}
  const NAME_ORDER = ['现货黄金','现货白银','国际原油','COMEX铜','LME铝','豆粕']
  const fNames = NAME_ORDER.filter(n => Object.values(fRankings).flat().some(i => i.name === n))
  const getFItem = (name, period) => (fRankings[period] || []).find(i => i.name === name)

  return (
    <div className="bg-[#0A0F14] h-full flex flex-col">
      <TopBar active="metals" />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={18} className="text-[#3B82F6]" />
          <span className="text-sm font-bold text-[#F0F2F5]">贵金属行情</span>
        </div>

        <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden mb-6">
          <table className="w-full text-[10px] table-fixed">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#242B33] bg-[#0D1117]">
                <th className="text-left px-2 py-1.5 font-normal w-1/4">品种</th>
                <th className="text-left px-2 py-1.5 font-normal leading-tight w-1/4">销售价<br/>(元/克)</th>
                <th className="text-left px-2 py-1.5 font-normal w-1/4">品种</th>
                <th className="text-left px-2 py-1.5 font-normal leading-tight w-1/4">价格<br/>(美元/盎司)</th>
              </tr>
            </thead>
            <tbody>
              {(data || [{},{},{},{}]).map((d, i) => {
                const chg = d.change || 0
                const intl = INTL_MAP[d.name]
                const intlPrice = intl?.code ? prices[intl.code]?.formattedPrice : '--'
                const intlChg = intl?.code ? prices[intl.code]?.change || 0 : 0
                return (
                <tr key={d.name || i} className={`border-b border-[#1A2129] ${i % 2 ? 'bg-[#0D1117]' : 'bg-[#12161C]'}`}>
                  <td className="px-2 py-2 text-[#F0F2F5] font-medium">{d.name || '--'}</td>
                  <td className="px-2 py-2 tabular-nums font-semibold" style={{ color: chg > 0 ? '#EF4444' : chg < 0 ? '#22C55E' : '#F0F2F5' }}>{d.price || '--'}</td>
                  <td className="px-2 py-2 text-[#8D949E]">{intl?.name || '--'}</td>
                  <td className="px-2 py-2 tabular-nums font-semibold" style={{ color: intlPrice !== '--' ? (intlChg > 0 ? '#EF4444' : intlChg < 0 ? '#22C55E' : '#F0F2F5') : '#8D949E' }}>{intlPrice}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 mb-2 ml-1">
          <TrendingUp size={18} className="text-[#3B82F6]" />
          <span className="text-sm font-bold text-[#F0F2F5]">商品预测</span>
          {forecast?.updated && (
            <span className="text-[9px] text-[#4D545C]">
              {new Date(forecast.updated).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <button onClick={async () => {
            try {
              const r = await fetch('/api/predict-data?file=moirai_ranking.json&t=' + Date.now(), { cache: 'no-cache' })
              const d = await r.json()
              setForecast(d)
            } catch(e) {}
          }} className="text-[10px] text-[#3B82F6] hover:underline active:opacity-60">刷新</button>
        </div>

        <div className="bg-[#12161C] border border-[#242B33] rounded-xl overflow-hidden mb-1">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] table-fixed">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#242B33]">
                  <th className="text-left px-1.5 py-1.5 font-normal bg-[#0D1117] sticky left-0 z-10">品种</th>
                  <th className="text-center px-1 py-1.5 font-normal">7天</th>
                  <th className="text-center px-1 py-1.5 font-normal">14天</th>
                  <th className="text-center px-1 py-1.5 font-normal">30天</th>
                  <th className="text-center px-1 py-1.5 font-normal">60天</th>
                  <th className="text-center px-1 py-1.5 font-normal">90天</th>
                </tr>
              </thead>
              <tbody>
                {fNames.map(name => (
                  <tr key={name} className="border-b border-[#1A2129]">
                    <td className="px-1.5 py-2 text-[#F0F2F5] bg-[#0D1117] sticky left-0 whitespace-nowrap font-medium">{name}</td>
                    {['7d','14d','30d','60d','90d'].map(p => {
                      const item = getFItem(name, p)
                      const val = item ? item.target : null
                      const up = item ? item.target > item.current : false
                      return (
                        <td key={p} className="text-center px-1 py-2 tabular-nums"
                          style={{ color: val ? (up ? '#EF4444' : '#22C55E') : '#8D949E' }}>
                          {val ? (up ? '+' : '') + val.toFixed(1) : '--'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-[9px] text-[#4D545C] text-center mb-6">免责声明：AI预测基于历史统计规律，不构成投资建议。</div>
      </div>

      <div className="flex-shrink-0 px-4 flex items-center justify-center gap-8 pb-4">
        <div className="text-[10px] text-[#6B7280] leading-relaxed text-center flex flex-col justify-center">
          <div>扫码添加微信</div>
          <div>回购黄金/铂金/钯金/银</div>
          <div>湖南省衡阳市</div>
        </div>
        <img src="/qrcode.jpg?v=2" alt="微信二维码" className="w-14 h-14 rounded-lg border border-[#242B33] object-cover" />
      </div>
    </div>
  )
}
