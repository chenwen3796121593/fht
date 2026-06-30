export async function onRequest() {
  const codes = ['nf_AU0','nf_AG0','nf_PT0','nf_PD0']
  const names = ['黄金','白银','铂金','钯金']
  try {
    const res = await fetch('https://hq.sinajs.cn/list=' + codes.join(','), {
      headers: { Referer: 'https://finance.sina.com.cn' },
    })
    const text = await res.text()
    const lines = text.split('\n').filter(l => l.trim())
    const result = codes.map((code, i) => {
      const line = lines.find(l => l.includes(code))
      if (!line) return { name: names[i], price: '--', change: 0 }
      const parts = line.replace(/^var hq_str_\w+="?/, '').replace(/";?\s*$/, '').split(',')
      // 现价: [8]卖价 [3]昨收价
      let price = parseFloat(parts[8]) || parseFloat(parts[6]) || 0
      let prevClose = parseFloat(parts[3]) || 0
      if (code === 'nf_AG0') { price = price / 1000; prevClose = prevClose / 1000 }
      const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
      return { name: names[i], price: price.toFixed(2), prevClose, change }
    })
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=5' },
    })
  } catch(e) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
