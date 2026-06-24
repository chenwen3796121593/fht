const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const u = new URL(req.url, 'http://localhost')

  function sendJson(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(data))
  }

  // Stock quotes (Sina hq.sinajs.cn)
  if (req.url.startsWith('/api/data')) {
    const list = u.searchParams.get('list')
    if (!list) { res.writeHead(400); return res.end('{}') }
    http.get({
      hostname: 'hq.sinajs.cn',
      path: '/list=' + list,
      headers: { Referer: 'https://finance.sina.com.cn' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => sendJson({ data: iconv.decode(Buffer.concat(chunks), 'gbk') }))
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  // News (Sina feed)
  if (req.url.startsWith('/api/news')) {
    const lid = u.searchParams.get('lid') || '2512'
    https.get({
      hostname: 'feed.mix.sina.com.cn',
      path: `/api/roll/get?pageid=153&lid=${lid}&num=20&page=1`,
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(Buffer.concat(chunks).toString())) } catch(e) { sendJson({}) } })
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  // K-line
  if (req.url.startsWith('/api/kline')) {
    const symbol = u.searchParams.get('symbol')
    const scale = u.searchParams.get('scale') || '240'
    const len = u.searchParams.get('len') || '90'
    if (!symbol) { res.writeHead(400); return res.end('[]') }

    // Commodity K-line: Sina GlobalFutures API (verified)
    const cMap = { hf_XAU: 'XAU', hf_XAG: 'XAG', hf_CL: 'CL', hf_HG: 'HG', hf_AHD: 'AHD' }
    const commCode = cMap[symbol]
    if (commCode) {
      https.get({
        hostname: 'stock2.finance.sina.com.cn',
        path: `/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${commCode}`,
        headers: { Referer: 'https://finance.sina.com.cn' },
      }, (sRes) => {
        const chunks = []
        sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }

    // Domestic futures K-line (豆粕 etc)
    if (symbol.startsWith('nf_')) {
      const innerCode = symbol.replace('nf_', '')
      https.get({
        hostname: 'stock2.finance.sina.com.cn',
        path: `/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${innerCode}`,
        headers: { Referer: 'https://finance.sina.com.cn' },
      }, (sRes) => {
        const chunks = []
        sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }

    // Stock/index K-line: Sina CN_MarketData
    https.get({
      hostname: 'money.finance.sina.com.cn',
      path: `/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&ma=5,10,20&datalen=${len}`,
      headers: { Referer: 'https://finance.sina.com.cn' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
    }).on('error', () => sendJson([]))
    return
  }

  // Market breadth
  if (req.url.startsWith('/api/breadth')) {
    let cached = null, cacheTime = 0
    const now = Date.now()
    if (cached && now - cacheTime < 30000) { sendJson(cached); return }

    async function fetchBreadth() {
      let up = 0, down = 0, limUp = 0, limDown = 0
      for (let page = 1; page <= 30; page++) {
        try {
          const data = await new Promise((resolve, reject) => {
            https.get({
              hostname: 'vip.stock.finance.sina.com.cn',
              path: `/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=changepercent&asc=0&node=hs_a`,
              headers: { Referer: 'https://finance.sina.com.cn' },
            }, (sRes) => {
              const chunks = []
              sRes.on('data', c => chunks.push(c))
              sRes.on('end', () => { try { resolve(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk'))) } catch(e) { resolve([]) } })
            }).on('error', () => resolve([]))
          })
          if (!data || data.length === 0) break
          for (const s of data) {
            const chg = parseFloat(s.changepercent) || 0
            if (chg > 0) up++; else if (chg < 0) down++
            if (chg >= 9.9) limUp++
            if (chg <= -9.9) limDown++
          }
          if (data.length < 100) break
        } catch(e) { break }
      }
      cached = { total: up + down, up, down, limUp, limDown }
      cacheTime = Date.now()
      sendJson(cached)
    }
    fetchBreadth()
    return
  }

  res.writeHead(404); res.end('not found')
})

server.listen(3456, () => console.log('Proxy on :3456'))
