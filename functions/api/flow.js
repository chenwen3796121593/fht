export async function onRequest() {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://emdatah5.eastmoney.com/dc/zjlx/block',
    }

    const [inRes, outRes] = await Promise.all([
      fetch('https://emdatah5.eastmoney.com/dc/ZJLX/getZDYLBData?fields=f2,f3,f12,f14,f62,f184&pn=1&pz=10&fid=f62&po=1&fs=m:90+t:2', { headers }),
      fetch('https://emdatah5.eastmoney.com/dc/ZJLX/getZDYLBData?fields=f2,f3,f12,f14,f62,f184&pn=1&pz=10&fid=f62&po=0&fs=m:90+t:2', { headers }),
    ])

    const inData = await inRes.json()
    const outData = await outRes.json()

    const mapItems = (arr) => {
      const items = arr?.data?.diff || arr?.data?.data?.diff || []
      return items.map(i => ({
        name: i.f14 || '?', code: i.f12 || '',
        change: parseFloat(i.f3) || 0, netFlow: parseFloat(i.f62) || 0, netRatio: parseFloat(i.f184) || 0,
      }))
    }

    return new Response(JSON.stringify({ data: mapItems(inData), outData: mapItems(outData) }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=30' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ data: [], outData: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
