export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const report = searchParams.get('report') || 'CURRENCY_SUPPLY'

  const reportMap = {
    CURRENCY_SUPPLY: 'RPT_ECONOMY_CURRENCY_SUPPLY',
    RMB_LOAN: 'RPT_ECONOMY_RMB_LOAN',
    DEPOSIT_RESERVE: 'RPT_ECONOMY_DEPOSIT_RESERVE',
  }

  const reportName = reportMap[report]
  if (!reportName) return r([])

  try {
    const url = `http://datacenter-web.eastmoney.com/api/data/v1/get?reportName=${reportName}&columns=ALL&pageSize=300&pageNumber=1&sortColumns=REPORT_DATE&sortTypes=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://data.eastmoney.com/' },
    })
    const json = await res.json()
    const data = (json?.result?.data || []).map((d) => ({
      date: (d.TIME || d.REPORT_DATE || '').replace('年', '-').replace('月份', '').replace('月', '').slice(0, 7),
      m2: parseFloat(d.BASIC_CURRENCY) / 10000 || 0,
      m1: parseFloat(d.CURRENCY) / 10000 || 0,
      m0: parseFloat(d.FREE_CASH) / 10000 || 0,
      m2Yoy: parseFloat(d.BASIC_CURRENCY_SAME) || 0,
      m1Yoy: parseFloat(d.CURRENCY_SAME) || 0,
      loan: parseFloat(d.RMB_LOAN) || 0,
      loanYoy: parseFloat(d.RMB_LOAN_SAME) || 0,
      loanAcc: parseFloat(d.RMB_LOAN_ACCUMULATE) / 10000 || 0,
      reserveRate: parseFloat(d.INTEREST_RATE_BA) || parseFloat(d.INTEREST_RATE_BB) || 0,
      reserveChange: parseFloat(d.CHANGE_RATE_B) || 0,
      shNext: parseFloat(d.NEXT_SH_RATE) || 0,
    })).filter(d => d.date && d.date.length === 7)
    return r(data)
  } catch (e) {
    return r([])
  }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
  })
}
