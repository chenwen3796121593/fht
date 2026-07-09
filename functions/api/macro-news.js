const MACRO_KW = [
  '央行', '美联储', '人民银行',
  '财政部', '国家统计局', '商务部', '发改委', '国务院',
  '欧洲央行', '日本央行', 'IMF', '世界银行',
  '利率决议', '货币政策', '存款准备金',
  '非农', '降息', '加息', 'LPR', '社融', '国债',
  'GDP', 'CPI', 'PMI', 'PPI', '通胀', '通缩',
  'M1', 'M2', '货币供应',
]

// 排除词：非宏观的公司层面新闻
const EXCLUDE = ['立案', '跌停', '涨停', '索赔', '减持', '回购', '分红', '业绩', 'ST', '退市']

export async function onRequest() {
  try {
    const res = await fetch('https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&num=30&page=1', {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' },
    })
    const json = await res.json()
    const items = (json?.result?.data || [])
      .filter(i => {
        const title = i.title || ''
        const full = title + (i.intro || '')
        // 只匹配标题，避免正文中顺带提到的假宏观
        const match = MACRO_KW.some(k => title.includes(k))
        const exclude = EXCLUDE.some(k => full.includes(k))
        return match && !exclude
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
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400', 'X-Macro-Version': 'v2' },
    })
  } catch (e) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
