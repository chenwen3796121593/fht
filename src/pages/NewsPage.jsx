import { useState, useEffect, useCallback } from 'react'
import TopBar from '../components/TopBar'
import { RefreshCw } from 'lucide-react'

const tabs = ['全部', '股票', '商品', '宏观']

function fmtTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NewsPage({ onNavigate }) {
  const [tab, setTab] = useState('全部')
  const [rssNews, setRssNews] = useState({ stock: [], commodity: [], macro: [] })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const urls = ['/api/rss-news?type=stock', '/api/rss-news?type=commodity', '/api/macro-news']
      const responses = await Promise.all(urls.map(u => fetch(u).catch(() => ({ json: () => [] }))))
      const data = await Promise.all(responses.map(r => r.json().catch(() => [])))
      const stock = Array.isArray(data[0]) ? data[0] : []
      const commodity = Array.isArray(data[1]) ? data[1] : []
      const macro = Array.isArray(data[2]) ? data[2] : []
      setRssNews({ stock, commodity, macro })
    } catch(e) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    // Only macro needs periodic refresh (every 5min)
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/macro-news')
        const macro = await res.json()
        setRssNews(prev => ({ ...prev, macro: Array.isArray(macro) ? macro : [] }))
      } catch(e) {}
    }, 300000)
    return () => clearInterval(t)
  }, [fetchAll])

  const getStars = (s) => { const m = (s?.title||'').match(/(★+)/); return m ? m[1].length : 0 }
  const all = [...rssNews.stock, ...rssNews.commodity, ...rssNews.macro].sort((a, b) => {
    const sa = getStars(a), sb = getStars(b)
    if (sa !== sb) return sb - sa
    return new Date(b.pubDate||b.time) - new Date(a.pubDate||a.time)
  })
  const filtered = tab === '全部' ? all
    : tab === '股票' ? rssNews.stock
    : tab === '商品' ? rssNews.commodity
    : rssNews.macro

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="news" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />

      <div className="px-4 pt-2 pb-2 flex items-center justify-between sticky top-[52px] bg-[#0A0F14] z-10">
        <div className="flex gap-1.5">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab===t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{t}</button>
          ))}
        </div>
        <button onClick={fetchAll} className="text-[#4D545C] hover:text-[#8D949E]"><RefreshCw size={14} className={loading?'animate-spin':''} /></button>
      </div>

      <div className="px-4 flex flex-col gap-1.5 pb-8">
        {loading && filtered.length===0 && <div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>}
        {filtered.map((n, i) => (
          <div key={i} className="block bg-[#12161C] rounded-lg p-3.5">
            <div className="text-sm font-semibold text-[#F0F2F5] leading-snug mb-1.5">{n.title}</div>
            {(n.summary||n.intro) && <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{n.summary||n.intro}</div>}
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span>{fmtTime(n.pubDate||n.time)}</span>
              {n.category && <><span>·</span><span>{n.category}</span></>}
              {n.source && <><span>·</span><span>{n.source}</span></>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
