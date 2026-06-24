import { useState, useEffect, useCallback } from 'react'
import TopBar from '../components/TopBar'
import { RefreshCw } from 'lucide-react'

const tabs = ['全部', '股票', '商品', '宏观']

export default function NewsPage({ onNavigate }) {
  const [tab, setTab] = useState('全部')
  const [rssNews, setRssNews] = useState({ stock: [], commodity: [] })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [stockRes, cmdtRes] = await Promise.all([
        fetch('/api/rss-news?type=stock'),
        fetch('/api/rss-news?type=commodity'),
      ])
      const [stockData, cmdtData] = await Promise.all([stockRes.json(), cmdtRes.json()])
      setRssNews({ stock: Array.isArray(stockData) ? stockData : [], commodity: Array.isArray(cmdtData) ? cmdtData : [] })
    } catch(e) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    // Data updates once per day, no auto-refresh needed
  }, [fetchAll])

  // Maintain old macro news via existing hook
  const macroNews = useMemo(() => [], [])

  const allNews = [...rssNews.stock, ...rssNews.commodity]
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

  const filtered = tab === '全部' ? allNews
    : tab === '股票' ? rssNews.stock
    : tab === '商品' ? rssNews.commodity
    : []

  function fmtTime(d) {
    if (!d) return ''
    const now = Date.now()
    const diff = now - new Date(d).getTime()
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // Parse HTML description to plain text
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').substring(0, 120)
  }

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="news" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />

      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={fetchAll} className="text-[#4D545C] hover:text-[#8D949E] transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-1.5 pb-8">
        {loading && filtered.length === 0 && (
          <div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>
        )}
        {!loading && filtered.length === 0 && tab === '宏观' && (
          <div className="text-center text-[#4D545C] text-sm py-12">宏观新闻暂未接入</div>
        )}
        {filtered.map((n, i) => (
          <a key={i} href={n.link || '#'} target="_blank" rel="noopener noreferrer" className="block bg-[#12161C] rounded-lg p-3.5 hover:bg-[#1A2129] transition-colors">
            <div className="text-sm font-semibold text-[#F0F2F5] leading-snug mb-1.5">{n.title}</div>
            {n.summary && <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{n.summary}</div>}
            {!n.summary && n.description && <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{stripHtml(n.description)}</div>}
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span>{fmtTime(n.pubDate)}</span>
              {n.category && <><span>·</span><span>{n.category}</span></>}
              {n.tab && <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-[#1A2129] text-[#8D949E]">{n.tab}</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
