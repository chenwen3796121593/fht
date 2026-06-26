export async function onRequest() {
  try {
    const res = await fetch('http://www.beijingrtj.com/admin/get_price5.php?t=' + Date.now(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const text = await res.text()
    const rs = text.split(',')
    if (rs.length < 17) return r([])
    return r([
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
  } catch(e) { return r([]) }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3' },
  })
}
