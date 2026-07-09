// 大佬观点 — Google News RSS 通过 Deno 代理（仅国际大佬）
const PROXY = 'https://naive-toad-3432.chenheping1974.deno.net'
const INTL = ['Nicky Shiels gold','Alasdair Macleod gold']

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
  } catch(e) { return [] }
}

export async function onRequest() {
  try {
    const ninetyDaysAgo = Date.now() - 90 * 86400000
    const intl = []
    for (const q of INTL) {
      const items = await fetchNews(q, 'en-US')
      intl.push(...items.filter(n => new Date(n.pubDate) > ninetyDaysAgo))
    }
    intl.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))

    return new Response(JSON.stringify({intl, domestic: []}), {
      headers: {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'},
    })
  } catch(e) {
    return new Response(JSON.stringify({intl:[], domestic:[]}), {
      headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
    })
  }
}
