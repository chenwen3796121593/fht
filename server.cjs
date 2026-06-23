const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')

const SINA_HOST = 'hq.sinajs.cn'

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Stock quotes proxy
  if (req.url.startsWith('/api/data')) {
    const url = new URL(req.url, 'http://localhost')
    const symbols = url.searchParams.get('list')
    if (!symbols) { res.writeHead(400); return res.end('{}') }

    http.get({
      hostname: SINA_HOST,
      path: '/list=' + symbols,
      headers: { Referer: 'https://finance.sina.com.cn' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => {
        const text = iconv.decode(Buffer.concat(chunks), 'gbk')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ data: text }))
      })
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  // News proxy
  if (req.url.startsWith('/api/news')) {
    const url = new URL(req.url, 'http://localhost')
    const sources = ['2509', '2512', '2515']
    const lid = url.searchParams.get('lid') || sources[0]

    https.get({
      hostname: 'feed.mix.sina.com.cn',
      path: `/api/roll/get?pageid=153&lid=${lid}&k=&num=30`,
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' },
    }, (sRes) => {
      const chunks = []
      sRes.on('data', c => chunks.push(c))
      sRes.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(json))
        } catch (e) {
          res.writeHead(500)
          res.end('{}')
        }
      })
    }).on('error', () => { res.writeHead(502); res.end('{}') })
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(3456, () => console.log('Proxy on :3456'))
