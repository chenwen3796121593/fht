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

  // Sector fund flow (东方财富)
  if (req.url.startsWith('/api/flow')) {
    const type = new URL(req.url, 'http://localhost').searchParams.get('type') || 'in'
    const po = type === 'in' ? '1' : '0'
    https.get({
      hostname: 'emdatah5.eastmoney.com',
      path: `/dc/ZJLX/getZDYLBData?fields=f2,f3,f12,f14,f62,f184&pn=1&pz=10&fid=f62&po=${po}&fs=m:90+t:2`,
      headers: { Referer: 'https://emdatah5.eastmoney.com/dc/zjlx/block', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 8000,
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(Buffer.concat(chunks).toString())) } catch(e) { sendJson({}) } })
    }).on('error', () => sendJson({}))
    return
  }

  // Market breadth (财联社)
  if (req.url === '/api/breadth') {
    https.get({
      hostname: 'x-quote.cls.cn',
      path: '/v2/quote/a/stock/emotion',
      headers: { Referer: 'https://www.cls.cn/', 'User-Agent': 'Mozilla/5.0' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          const d = json?.data?.up_down_dis
          if (d) {
            sendJson({ total: d.rise_num + d.fall_num + d.flat_num, up: d.rise_num, down: d.fall_num, limUp: d.up_num, limDown: d.down_num })
          } else { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) }
        } catch (e) { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) }
      })
    }).on('error', () => { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) })
    return
  }

  res.writeHead(404); res.end('not found')
})

server.listen(3456, () => console.log('Proxy on :3456'))
