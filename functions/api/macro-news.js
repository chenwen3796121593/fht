const MACRO_KW = [
  '央行', '美联储', '人民银行', '证监会', '银保监', '财政部',
  '国家统计局', '商务部', '发改委', '国务院',
  '欧洲央行', '日本央行', 'IMF', '世界银行',
  '利率决议', '货币政策', '存款准备金',
  '非农', '降息', '加息', 'LPR',
  '汇率', '国债', '社融',
]

export async function onRequest() {
  try {
    const res = await fetch('https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&num=30&page=1', {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' },
    })
    const json = await res.json()
    const items = (json?.result?.data || [])
      .filter(i => {
        const t = (i.title + i.intro).toLowerCase()
        return MACRO_KW.some(k => t.includes(k))
      })
      .map(i => ({
        title: i.title || '',
        intro: i.intro || '',
        time: i.ctime ? new Date(i.ctime * 1000).toISOString() : '',
        source: i.media_name || '新浪财经',
        url: i.url || '',
        category: '宏观',
      }))
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (e) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
