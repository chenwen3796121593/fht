export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const type = searchParams.get('type') || 'stock' // stock | commodity

  const urls = {
    stock: 'https://chenheping1974.github.io/tv-signals/feeds/a-stocks.xml',
    commodity: 'https://chenheping1974.github.io/tv-signals/feeds/commodities.xml',
  }

  const url = urls[type]
  if (!url) return r([])

  try {
    const res = await fetch(url)
    const xml = await res.text()

    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]
      const getTag = (tag) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
        return m ? m[1].trim() : ''
      }
      const title = getTag('title')
      const link = getTag('link')
      const description = getTag('description')
      const pubDate = getTag('pubDate')
      const category = getTag('category')

      // Extract sentiment
      const sentiment = title.match(/[🔴🟡🟢]/)?.[0] || ''

      // Extract summary from description
      const summaryMatch = description.match(/<strong>摘要<\/strong>：([^<]*)/)
      const summary = summaryMatch ? summaryMatch[1] : ''

      items.push({ title, link, description, pubDate, category, sentiment, summary })
    }

    return r(items)
  } catch (e) {
    return r([])
  }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=120' },
  })
}
