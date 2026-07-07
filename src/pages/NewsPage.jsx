import { useState, useEffect, useCallback } from 'react'
import TopBar from '../components/TopBar'
import TabDropdown from '../components/TabDropdown'
import { NEWS_INTERVAL } from '../lib/constants.js'

const tabs = ['KITCO', '宏观']
const DALAO_TABS = [{key:'intl',label:'国际大佬'},{key:'domestic',label:'券商首席'}]


function fmtTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NewsPage() {
  const [tab, setTab] = useState('股票')
  const [rssNews, setRssNews] = useState({ kitco: [], macro: [] })
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
      const urls = ['/api/kitco-news', '/api/macro-news']
      const responses = await Promise.all(urls.map(u => fetch(u).catch(() => ({ json: () => [] }))))
      const data = await Promise.all(responses.map(r => r.json().catch(() => [])))
      setRssNews({ kitco: Array.isArray(data[0]) ? data[0] : [], macro: Array.isArray(data[1]) ? data[1] : [] })
    } catch(e) {}
    setLoading(false)
  }, [])



  // KITCO 点标签时刷新
  useEffect(() => {
    if (tab !== 'KITCO') return
    fetch('/api/kitco-news').then(r => r.json()).then(d => {
      setRssNews(prev => ({ ...prev, kitco: Array.isArray(d) ? d : [] }))
    }).catch(() => {})
  }, [tab])

  useEffect(() => {
    fetchAll()
    const t = setInterval(async () => {
      try { const res = await fetch('/api/macro-news'); const macro = await res.json(); setRssNews(prev => ({ ...prev, macro: Array.isArray(macro) ? macro : [] })) } catch(e) {}
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
          <TabDropdown tabs={DALAO_TABS} active={dalaoTab} onChange={(k) => { setTab('dalao'); setDalaoTab(k) }} className={tab==='dalao' ? '' : ''} />
        </div>
      </div>

      {tab === 'dalao' ? (
        <div className="px-4 flex flex-col gap-3 pb-8">
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
              : <div className="flex flex-col gap-1.5">{Array.from({length:5}).map((_,i)=>(
                <div key={i} className="bg-[#12161C] rounded-lg p-3.5 animate-pulse">
                  <div className="h-3 bg-[#1A2129] rounded w-3/4 mb-2" />
                  <div className="h-2 bg-[#1A2129] rounded w-1/4" />
                </div>
              ))}</div>
            }
          </div>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-1.5 pb-8">
          {loading && filtered.length===0 && <div className="text-center text-[#4D545C] text-sm py-12">加载中...</div>}
          {filtered.map((n, i) => (
            <div key={i} className="block bg-[#12161C] rounded-lg p-3.5">
              <div className="text-sm font-semibold text-[#F0F2F5] leading-snug mb-1.5">{n.title}</div>
              {tab === 'KITCO' && translations['kitco_'+i] && <div className="text-sm text-[#22C55E] leading-snug mb-1">{translations['kitco_'+i]}</div>}
              {(n.summary||n.intro) && <div className="text-[11px] text-[#8D949E] leading-relaxed line-clamp-2 mb-2">{n.summary||n.intro}</div>}
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                <span>{fmtTime(n.pubDate||n.time)}</span>
                {tab === 'KITCO' && !translations['kitco_'+i] && (
                  <button onClick={async () => {
                    try {
                      const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: n.title }) })
                      const j = await r.json()
                      if (j.result) setTranslations(prev => ({ ...prev, ['kitco_'+i]: j.result }))
                    } catch(e) {}
                  }} className="text-[#3B82F6] hover:underline text-[10px]">翻译</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
