import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'fh_news'
const DB_VER = 1

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('news')) {
        db.createObjectStore('news', { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function cacheNews(items) {
  const db = await openDB()
  const tx = db.transaction('news', 'readwrite')
  const store = tx.objectStore('news')
  for (const item of items) {
    store.put(item)
  }
  return new Promise(r => { tx.oncomplete = r })
}

async function getCachedNews(since) {
  const db = await openDB()
  const tx = db.transaction('news', 'readonly')
  const store = tx.objectStore('news')
  const all = await new Promise(r => {
    const req = store.getAll()
    req.onsuccess = () => r(req.result)
  })
  // Filter by time, then sort
  return all.filter(n => n.time > since).sort((a, b) => b.time - a.time)
}

// Strict categorization: only show news matching user's actual watchlist
const MACRO_SOURCES = [
  '央行', '美联储', '人民银行', '证监会', '银保监', '财政部',
  '国家统计局', '商务部', '发改委', '国务院', '中央',
  '上交所', '深交所', '港交所', '纽交所', '纳斯达克',
  '欧洲央行', '日本央行', 'IMF', '世界银行', 'OPEC',
  '利率决议', '货币政策', 'GDP', 'CPI', 'PMI', 'PPI',
  '非农', '通胀', '降息', '加息', '存款准备金',
]

function tagAndScore(title, content, watchlist) {
  const text = (title + ' ' + content)

  // Build keyword lists from watchlist
  const stockKw = [], commodityKw = []
  for (const w of watchlist) {
    if (!w.name) continue
    const n = w.name
    // Commodities → use short keywords
    if (n.match(/黄金/)) { commodityKw.push('黄金', '金价', 'XAU', '贵金属') }
    else if (n.match(/白银/)) { commodityKw.push('白银', '银价', 'XAG') }
    else if (n.match(/原油|石油/)) { commodityKw.push('原油', '石油', '油价', 'WTI', '布伦特') }
    else if (n.match(/铜/)) { commodityKw.push('铜', '铜价', '沪铜', '伦铜') }
    else if (n.match(/铝/)) { commodityKw.push('铝', '铝价', '沪铝', '伦铝') }
    else if (n.match(/大豆|豆粕/)) { commodityKw.push('大豆', '豆粕', '豆价') }
    // Stock → use partial name matching
    else {
      stockKw.push(n)
      // Auto-generate short forms
      if (n.includes('茅台')) stockKw.push('茅台', '贵州茅台')
      if (n.includes('平安')) stockKw.push('平安', '中国平安')
      if (n.includes('比亚迪')) stockKw.push('比亚迪')
      if (n.includes('宁德')) stockKw.push('宁德', '宁德时代')
    }
  }

  // Deduplicate keywords
  const unique = arr => [...new Set(arr.filter(Boolean))]
  const sKw = unique(stockKw), cKw = unique(commodityKw)

  // 股票: news must contain a watchlist stock keyword
  if (sKw.some(k => text.includes(k))) {
    return { tab: '股票', score: 5 }
  }

  // 商品: news must contain a watchlist commodity keyword
  if (cKw.some(k => text.includes(k))) {
    return { tab: '商品', score: 5 }
  }

  // 宏观: must contain authoritative source keywords
  if (MACRO_SOURCES.some(k => text.includes(k))) {
    const topSources = ['美联储', '央行', '证监会', '国务院', '利率决议', '降息', '加息']
    const score = topSources.some(k => text.includes(k)) ? 4 : 2
    return { tab: '宏观', score }
  }

  // Only show stock/commodity news if it matches the user's actual watchlist
  // No general fallback — if it's not about their stocks or commodities, it's not shown
  // (macros still show via authoritative sources above)

  return { tab: null, score: -1 }
}

// Fetch from Sina finance news
async function fetchSinaNews(watchlist) {
  const sources = [
    '/api/news?lid=2509', // 财经
    '/api/news?lid=2512', // 股票
    '/api/news?lid=2517', // 商品/期货
    '/api/news?lid=2518', // 全球市场
  ]

  const allNews = []
  for (const url of sources) {
    try {
      const res = await fetch(url)
      const json = await res.json()
      const list = json?.result?.data || []
      for (const item of list) {
        const time = new Date(item.ctime * 1000 || item.mtime * 1000 || Date.now())
        const { tab, score } = tagAndScore(item.title || '', item.intro || '', watchlist)
        if (tab === null) continue // skip irrelevant news
        allNews.push({
          id: item.docid || item.url || Math.random().toString(36),
          title: item.title || '',
          content: item.intro || '',
          source: item.media_name || item.source || '新浪财经',
          time,
          url: item.url || '',
          tab,
          score,
        })
      }
    } catch (e) {
      // skip failed source
    }
  }
  return allNews
}

export default function useNews(watchSymbols = []) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Try live data first
      const live = await fetchSinaNews(watchSymbols)

      // Also check for specific watchlist symbols
      const keywords = watchSymbols.map(s => s.name || s).filter(Boolean)
      if (keywords.length > 0) {
        for (const item of live) {
          const text = item.title + item.content
          for (const kw of keywords) {
            if (text.includes(kw)) {
              item.tab = item.tab === '宏观' && kw.length > 1 ? '股票' : item.tab
              break
            }
          }
        }
      }

      if (live.length > 0) {
        await cacheNews(live)
        setNews(live)
      } else {
        // Fallback to cache
        const since = Date.now() - 86400000 * 3 // 3 days
        const cached = await getCachedNews(since)
        setNews(cached)
      }
    } catch (e) {
      const since = Date.now() - 86400000 * 3
      const cached = await getCachedNews(since)
      setNews(cached)
    }
    setLoading(false)
  }, [watchSymbols.join(',')])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 60000) // refresh every 60s
    return () => clearInterval(t)
  }, [fetchAll])

  // Deduplicate, sort by score desc, limit to important
  const seen = new Set()
  const unique = news
    .filter(n => {
      if (seen.has(n.title)) return false
      seen.add(n.title)
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)

  return { news: unique, loading, refresh: fetchAll }
}
