import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import useNews from '../hooks/useNews'
import { Newspaper, RefreshCw } from 'lucide-react'

const tabs = ['全部', '股票', '商品', '宏观']

// Read user's watchlist from localStorage
function getWatchSymbols() {
  try {
    const custom = JSON.parse(localStorage.getItem('fh_custom') || '[]')
    const defaults = [
      { symbol: 'hf_XAU', name: '现货黄金' },
      { symbol: 'hf_XAG', name: '现货白银' },
      { symbol: 'hf_CL', name: '国际原油' },
      { symbol: 'hf_HG', name: 'COMEX铜' },
    ]
    return [...defaults, ...custom]
  } catch { return [] }
}

function fmtTime(d) {
  const now = Date.now()
  const diff = now - new Date(d).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NewsPage({ onNavigate }) {
  const [tab, setTab] = useState('全部')
  const symbols = useMemo(() => getWatchSymbols(), [])
  const { news, loading, refresh } = useNews(symbols)

  const filtered = tab === '全部' ? news : news.filter(n => n.tab === tab)

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="news" onHome={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />

      {/* Tabs */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="text-[#4D545C] hover:text-[#8D949E]" title="刷新">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 flex flex-col gap-1.5 pb-8">
        {loading && filtered.length === 0 && (
          <div className="text-center text-[#4D545C] text-sm py-12">
            <Newspaper size={32} className="mx-auto mb-3 opacity-50" />
            加载新闻中...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-[#4D545C] text-sm py-12">
            <Newspaper size={32} className="mx-auto mb-3 opacity-50" />
            暂无相关新闻
          </div>
        )}
        {filtered.map((n, i) => (
          <a
            key={n.id || i}
            href={n.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#12161C] rounded-lg p-3.5 hover:bg-[#1A2129] transition-colors"
          >
            <div className="text-sm font-semibold text-[#F0F2F5] leading-snug mb-1.5">{n.title}</div>
            <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{n.content}</div>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span>{n.source}</span>
              <span>·</span>
              <span>{fmtTime(n.time)}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-[#1A2129] text-[#8D949E]">{n.tab}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
