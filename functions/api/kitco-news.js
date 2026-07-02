// Kitco 贵金属新闻 — Google News RSS
const PROXY = 'https://naive-toad-3432.chenheping1974.deno.net'

export async function onRequest() {
  try {
    const res = await fetch(`${PROXY}/?q=kitco+gold+silver+precious+metals&hl=en-US&gl=US&ceid=US:en`)
    const text = await res.text()
    const items = []
    for (const m of [...text.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 10)) {
      const title = ((m[1].match(/<title>(.*?)<\/title>/i)||[])[1]||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
      const link = ((m[1].match(/<link>(.*?)<\/link>/i)||[])[1]||'').trim()
      const pubDate = ((m[1].match(/<pubDate>(.*?)<\/pubDate>/i)||[])[1]||'').trim()
      if (title) items.push({title, link, pubDate, source:'Google News'})
    }
    return new Response(JSON.stringify(items), {
      headers: {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=1800'},
    })
  } catch(e) {
    return new Response('[]', {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}})
  }
}
