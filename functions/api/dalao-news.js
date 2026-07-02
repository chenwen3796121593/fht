// 大佬观点 — Google News RSS 通过 Deno 代理
const PROXY = 'https://naive-toad-3432.chenheping1974.deno.net'

const INTL = ['Nicky Shiels gold','Alasdair Macleod gold']
const DOM = ['王鹤涛','郭磊 宏观','张瑜 宏观','李超 首席','刘晨明 策略','傅静涛 策略','牟一凌 策略']

async function fetchNews(query, lang) {
  try {
    const suffix = `&hl=${lang}&gl=${lang==='zh-CN'?'CN':'US'}&ceid=${lang==='zh-CN'?'CN:zh-Hans':'US:en'}`
    const res = await fetch(`${PROXY}/?q=${encodeURIComponent(query)}${suffix}`)
    const text = await res.text()
    const items = []
    for (const m of [...text.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 10)) {
      const title = ((m[1].match(/<title>(.*?)<\/title>/i)||[])[1]||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
      const link = ((m[1].match(/<link>(.*?)<\/link>/i)||[])[1]||'').trim()
      const pubDate = ((m[1].match(/<pubDate>(.*?)<\/pubDate>/i)||[])[1]||'').trim()
      if (title) items.push({title, link, pubDate, source:'Google News'})
    }
    return items
  } catch(e) { return [{title:'ERR: '+e.message, pubDate:'', source:''}] }
}

export async function onRequest() {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const ninetyDaysAgo = Date.now() - 90 * 86400000

    // 顺序请求，避免 Deno/Google 并发限流
    const intl = [], domestic = []
    for (const q of INTL) {
      const items = await fetchNews(q, 'en-US')
      intl.push(...items.filter(n => new Date(n.pubDate) > ninetyDaysAgo))
    }
    for (const q of DOM) {
      const items = await fetchNews(q, 'zh-CN')
      domestic.push(...items.filter(n => new Date(n.pubDate) > thirtyDaysAgo))
    }
    intl.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))
    domestic.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))

    return new Response(JSON.stringify({intl, domestic}), {
      headers: {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'},
    })
  } catch(e) {
    return new Response(JSON.stringify({intl:[], domestic:[]}), {
      headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
    })
  }
}
