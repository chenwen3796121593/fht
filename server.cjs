const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')

const ITICK_KEY = process.env.ITICK_KEY || 'd85feb46383545639ddcd24667a3c89c7e66ab17a8a34dce89e20c5e4576f4c3'
const FOREX_MAP = { XAU: 'XAUUSD', XAG: 'XAGUSD' }
const FUTURE_MAP = { CL: 'CL', HG: 'HG', AHD: 'ALI' }

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const u = new URL(req.url, 'http://localhost')

  function sendJson(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(data))
  }

  if (req.url.startsWith('/api/data')) {
    const list = u.searchParams.get('list')
    if (!list) { res.writeHead(400); return res.end('{}') }
    http.get({ hostname: 'hq.sinajs.cn', path: '/list=' + list, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => sendJson({ data: iconv.decode(Buffer.concat(chunks), 'gbk') }))
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  if (req.url.startsWith('/api/news')) {
    const lid = u.searchParams.get('lid') || '2512'
    https.get({ hostname: 'feed.mix.sina.com.cn', path: `/api/roll/get?pageid=153&lid=${lid}&num=20&page=1`, headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(Buffer.concat(chunks).toString())) } catch(e) { sendJson({}) } })
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  if (req.url.startsWith('/api/kline')) {
    const symbol = u.searchParams.get('symbol')
    const scale = u.searchParams.get('scale') || '240'
    const len = u.searchParams.get('len') || '90'
    const isIntraday = u.searchParams.get('intraday') === '1'
    if (!symbol) { res.writeHead(400); return res.end('[]') }

    const cMap = { hf_XAU: 'XAU', hf_XAG: 'XAG', hf_CL: 'CL', hf_HG: 'HG', hf_AHD: 'AHD' }
    const commCode = cMap[symbol]

    // Intraday via iTick: gold/silver→forex, others→futures
    if (commCode && isIntraday) {
      let hostname, path
      if (FOREX_MAP[commCode]) {
        hostname = 'api.itick.org'
        path = `/forex/kline?region=GB&code=${FOREX_MAP[commCode]}&kType=3&limit=240`
      } else if (FUTURE_MAP[commCode]) {
        hostname = 'api.itick.org'
        path = `/future/kline?region=US&code=${FUTURE_MAP[commCode]}&kType=2&limit=240`
      } else { sendJson([]); return }
      https.get({ hostname, path, headers: { accept: 'application/json', token: ITICK_KEY } }, (sRes) => {
        const chunks = []; sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString())
            const bars = json?.data?.kLineList || json?.data?.kLines || json?.data || []
            const parsed = (Array.isArray(bars) ? bars : []).map(b => ({
              open: parseFloat(b.o || b.open) || 0, close: parseFloat(b.c || b.close) || 0,
              high: parseFloat(b.h || b.high) || 0, low: parseFloat(b.l || b.low) || 0,
              volume: parseFloat(b.v || b.volume) || 0,
            })).filter(b => b.open && b.close)
            sendJson(parsed)
          } catch(e) { sendJson([]) }
        })
      }).on('error', () => sendJson([]))
      return
    }

    // Intraday: domestic futures / China stocks via Sina
    if (symbol.startsWith('nf_') && isIntraday) {
      const innerCode = symbol.replace('nf_', '')
      https.get({ hostname: 'stock2.finance.sina.com.cn', path: `/futures/api/json_v2.php/IndexService.getInnerFuturesMinuteKLine?symbol=${innerCode}&type=5`, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
        const chunks = []; sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }
    if (isIntraday) {
      https.get({ hostname: 'money.finance.sina.com.cn', path: `/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&ma=no&datalen=240`, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
        const chunks = []; sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }

    // Daily
    if (commCode) {
      https.get({ hostname: 'stock2.finance.sina.com.cn', path: `/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${commCode}`, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
        const chunks = []; sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }
    if (symbol.startsWith('nf_')) {
      const innerCode = symbol.replace('nf_', '')
      https.get({ hostname: 'stock2.finance.sina.com.cn', path: `/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${innerCode}`, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
        const chunks = []; sRes.on('data', c => chunks.push(c))
        sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
      }).on('error', () => sendJson([]))
      return
    }
    https.get({ hostname: 'money.finance.sina.com.cn', path: `/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&ma=5,10,20&datalen=${len}`, headers: { Referer: 'https://finance.sina.com.cn' } }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk')) || []) } catch(e) { sendJson([]) } })
    }).on('error', () => sendJson([]))
    return
  }

  // === Precious metals (beijingrtj.com) ===
  if (req.url.startsWith('/api/metals')) {
    http.get({ hostname: 'www.beijingrtj.com', path: '/admin/get_price5.php?t=' + Date.now(), headers: { 'User-Agent': 'Mozilla/5.0' } }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString()
          const rs = text.split(',')
          if (rs.length < 17) return sendJson([])
          sendJson([
            { name: '黄金', buy: rs[1], sell: rs[2], time: rs[16] },
            { name: '白银', buy: rs[3], sell: rs[4], time: rs[16] },
            { name: '铂金', buy: rs[5], sell: rs[6], time: rs[16] },
            { name: '钯金', buy: rs[7], sell: rs[8], time: rs[16] },
            { name: '千足金', buy: rs[11], sell: '', time: rs[16] },
            { name: '18K（黄金）', buy: rs[12], sell: '', time: rs[16] },
            { name: 'Pt950', buy: rs[13], sell: '', time: rs[16] },
            { name: 'Pd990', buy: rs[14], sell: '', time: rs[16] },
            { name: 'Ag925', buy: rs[15], sell: '', time: rs[16] },
          ])
        } catch(e) { sendJson([]) }
      })
    }).on('error', () => sendJson([]))
    return
  }

  if (req.url.startsWith('/api/flow')) {
    const type = new URL(req.url, 'http://localhost').searchParams.get('type') || 'in'
    const po = type === 'in' ? '1' : '0'
    https.get({ hostname: 'emdatah5.eastmoney.com', path: `/dc/ZJLX/getZDYLBData?fields=f2,f3,f12,f14,f62,f184&pn=1&pz=10&fid=f62&po=${po}&fs=m:90+t:2`, headers: { Referer: 'https://emdatah5.eastmoney.com/dc/zjlx/block', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }, timeout: 8000 }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => { try { sendJson(JSON.parse(Buffer.concat(chunks).toString())) } catch(e) { sendJson({}) } })
    }).on('error', () => sendJson({}))
    return
  }
  if (req.url === '/api/breadth') {
    https.get({ hostname: 'x-quote.cls.cn', path: '/v2/quote/a/stock/emotion', headers: { Referer: 'https://www.cls.cn/', 'User-Agent': 'Mozilla/5.0' } }, (sRes) => {
      const chunks = []; sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          const d = json?.data?.up_down_dis
          if (d) { sendJson({ total: d.rise_num + d.fall_num + d.flat_num, up: d.rise_num, down: d.fall_num, limUp: d.up_num, limDown: d.down_num }) }
          else { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) }
        } catch (e) { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) }
      })
    }).on('error', () => { sendJson({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }) })
    return
  }
  res.writeHead(404); res.end('not found')
})

server.listen(3456, () => console.log('Proxy on :3456'))
