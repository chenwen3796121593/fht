import { useState, useEffect, useCallback } from 'react'
import TopBar from '../components/TopBar'
import { NEWS_INTERVAL } from '../lib/constants.js'

const tabs = ['股票', '商品', '宏观', '大佬观点']


function fmtTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NewsPage() {
  const [tab, setTab] = useState('股票')
  const [rssNews, setRssNews] = useState({ stock: [], commodity: [], macro: [] })
  const [loading, setLoading] = useState(true)
  const [dalaoData, setDalaoData] = useState(null)
  const [dalaoTab, setDalaoTab] = useState('domestic')
  const [translations, setTranslations] = useState({})

  useEffect(() => {
    fetch('/api/dalao-news?v=new').then(r => r.json()).then(d => setDalaoData(d)).catch(() => {})
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const urls = ['/api/rss-news?type=stock', '/api/rss-news?type=commodity', '/api/macro-news']
      const responses = await Promise.all(urls.map(u => fetch(u).catch(() => ({ json: () => [] }))))
      const data = await Promise.all(responses.map(r => r.json().catch(() => [])))
      const sortByStars = (arr) => arr.sort((a, b) => {
        const sa = (a.title||'').match(/(★+)/)?.[1]?.length || 0
        const sb = (b.title||'').match(/(★+)/)?.[1]?.length || 0
        if (sa !== sb) return sb - sa
        return new Date(b.pubDate||0) - new Date(a.pubDate||0)
      })
      setRssNews({ stock: sortByStars(Array.isArray(data[0]) ? data[0] : []), commodity: sortByStars(Array.isArray(data[1]) ? data[1] : []), macro: Array.isArray(data[2]) ? data[2] : [] })
    } catch(e) {}
    setLoading(false)
  }, [])



  useEffect(() => {
    fetchAll()
    const t = setInterval(async () => {
      try { const res = await fetch('/api/macro-news'); const macro = await res.json(); setRssNews(prev => ({ ...prev, macro: Array.isArray(macro) ? macro : [] })) } catch(e) {}
    }, NEWS_INTERVAL)
    return () => clearInterval(t)
  }, [fetchAll])

  const sorted = (arr) => [...arr].sort((a,b) => new Date(b.pubDate||b.time) - new Date(a.pubDate||a.time))
  const all = sorted([...rssNews.stock, ...rssNews.commodity, ...rssNews.macro])
  const filtered = tab === '股票' ? rssNews.stock : tab === '商品' ? rssNews.commodity : tab === '宏观' ? rssNews.macro : all

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="news" />
      <div className="px-4 pt-2 pb-2 flex items-center justify-between sticky top-[52px] bg-[#0A0F14] z-10">
        <div className="flex gap-1.5">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab===t ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === '大佬观点' ? (
        <div className="px-4 flex flex-col gap-3 pb-8">
          <div className="flex gap-1.5 pt-1 pb-2 sticky top-[82px] bg-[#0A0F14] z-10">
            <button onClick={() => setDalaoTab('intl')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${dalaoTab==='intl' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>国际大佬</button>
            <button onClick={() => setDalaoTab('domestic')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${dalaoTab==='domestic' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>券商首席</button>
          </div>
          <div className="flex flex-col gap-1">
            {(dalaoTab==='intl' ? dalaoData?.intl : dalaoData?.domestic)?.length > 0
              ? (dalaoTab==='intl' ? dalaoData.intl : dalaoData.domestic).map((n, i) => (
                <div key={i} className="bg-[#12161C] rounded-lg p-3.5">
                  <div className="text-sm text-[#D1D5DB] leading-snug">{n.title}</div>
                  {dalaoTab === 'intl' && translations['intl_'+i] && <div className="text-sm text-[#22C55E] leading-snug mt-1">{translations['intl_'+i]}</div>}
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-1">
                    <span>{n.pubDate ? new Date(n.pubDate).toLocaleDateString('zh-CN', {month:'short',day:'numeric'}) : ''}</span>
                    {dalaoTab === 'intl' && !translations['intl_'+i] && (
                      <button onClick={async () => {
                        try {
                          const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: n.title }) })
                          const j = await r.json()
                          if (j.result) setTranslations(prev => ({ ...prev, ['intl_'+i]: j.result }))
                        } catch(e) {}
                      }} className="text-[#3B82F6] hover:underline">翻译</button>
                    )}
                  </div>
                </div>
              ))
              : <div className="text-center text-[#4D545C] text-sm py-8">加载中...</div>
            }
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
