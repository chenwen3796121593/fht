import { useState, useEffect, useCallback } from 'react'
import TopBar from '../components/TopBar'
import { NEWS_INTERVAL } from '../lib/constants.js'

const tabs = ['KITCO', '宏观']


function fmtTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NewsPage() {
  const [tab, setTab] = useState('KITCO')
  const [rssNews, setRssNews] = useState({ kitco: [], macro: [] })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const urls = ['/api/kitco-news?v=5', '/api/macro-news?v=5']
      const responses = await Promise.all(urls.map(u => fetch(u).catch(() => ({ json: () => [] }))))
      const data = await Promise.all(responses.map(r => r.json().catch(() => [])))
      setRssNews({ kitco: Array.isArray(data[0]) ? data[0] : [], macro: Array.isArray(data[1]) ? data[1] : [] })
    } catch(e) {}
    setLoading(false)
  }, [])



  // KITCO 点标签时刷新
  useEffect(() => {
    if (tab !== 'KITCO') return
    fetch('/api/kitco-news?v=5').then(r => r.json()).then(d => {
      setRssNews(prev => ({ ...prev, kitco: Array.isArray(d) ? d : [] }))
    }).catch(() => {})
  }, [tab])

  useEffect(() => {
    fetchAll()
    const t = setInterval(async () => {
      try { const res = await fetch('/api/macro-news?v=5'); const macro = await res.json(); setRssNews(prev => ({ ...prev, macro: Array.isArray(macro) ? macro : [] })) } catch(e) {}
    }, NEWS_INTERVAL)
    return () => clearInterval(t)
  }, [fetchAll])

  const sorted = (arr) => [...arr].sort((a,b) => new Date(b.pubDate||b.time) - new Date(a.pubDate||a.time))
  const all = sorted([...rssNews.kitco, ...rssNews.macro])
  const filtered = tab === 'KITCO' ? rssNews.kitco : tab === '宏观' ? rssNews.macro : all

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="news" />
      <div className="px-4 pt-2 pb-2 flex items-center justify-between sticky top-[52px] bg-[#0A0F14] z-20">
        <div className="flex gap-1.5 items-center">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab===t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{t}</button>
          ))}
        </div>
      </div>

        <div className="px-4 flex flex-col gap-1.5 pb-8">
          {loading && filtered.length===0 && <div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>}
          {filtered.map((n, i) => (
            <div key={i} className="block bg-[#12161C] rounded-lg p-3.5">
              <div className="text-sm font-semibold text-[#F0F2F5] leading-snug mb-1.5">{n.title}</div>
              {(n.summary||n.intro) && <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{n.summary||n.intro}</div>}
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                <span>{fmtTime(n.pubDate||n.time)}</span>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
