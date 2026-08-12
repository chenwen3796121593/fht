// 个股图表研判 — 解析股票代码/名称，抓取多周期 K 线，按价格结构研判方法流式输出报告
// 名称统一中性，不含任何方法论署名
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

// 常见标的名称→代码（仅 A 股，含 A 股指数；其余走在线建议补全）
const NAME_MAP = {
  '上证指数': 'sh000001', '深证成指': 'sz399001', '创业板指': 'sz399006', '沪深300': 'sh000300',
  '贵州茅台': 'sh600519', '五粮液': 'sz000858', '比亚迪': 'sz002594', '宁德时代': 'sz300750',
  '中国平安': 'sh601318', '招商银行': 'sh600036', '工商银行': 'sh601398', '建设银行': 'sh601939',
  '农业银行': 'sh601288', '中国银行': 'sh601988', '平安银行': 'sz000001', '兴业银行': 'sh601166',
  '中信证券': 'sh600030', '东方财富': 'sz300059', '三一重工': 'sh600031', '美的集团': 'sz000333',
  '格力电器': 'sz000651', '伊利股份': 'sh600887', '海康威视': 'sz002415', '立讯精密': 'sz002475',
  '京东方a': 'sz000725', 'tcl科技': 'sz000100', '隆基绿能': 'sh601012', '通威股份': 'sh600438',
  '紫金矿业': 'sh601899', '山东黄金': 'sh600547', '中金黄金': 'sh600489', '江西铜业': 'sh600362',
  '北方华创': 'sz002371', '中芯国际': 'sh688981', '韦尔股份': 'sh603501', '兆易创新': 'sh603986',
  '汇川技术': 'sz300124', '歌尔股份': 'sz002241', '三安光电': 'sh600703', '长江电力': 'sh600900',
  '中国神华': 'sh601088', '中国石油': 'sh601857', '中国石化': 'sh600028', '陕西煤业': 'sh601225',
  '牧原股份': 'sz002714', '温氏股份': 'sz300498', '双汇发展': 'sz000895', '海天味业': 'sh603288',
  '药明康德': 'sh603259', '恒瑞医药': 'sh600276', '迈瑞医疗': 'sz300760', '智飞生物': 'sz300122',
  '顺丰控股': 'sz002352', '中远海控': 'sh601919', '保利发展': 'sh600048', '万科a': 'sz000002',
  '东方明珠': 'sh600637', '上汽集团': 'sh600104', '广汽集团': 'sh601238', '长安汽车': 'sz000625',
}

const SYMBOL_PATTERN = /\b(sh\d{6}|sz\d{6}|bj\d{6})\b/i
const SINA_REF = 'https://finance.sina.com.cn'

// —— 名称→代码解析 ——
function resolveCode(raw) {
  const q = (raw || '').trim()
  if (!q) return null
  const m = q.match(SYMBOL_PATTERN)
  if (m) return m[0].toLowerCase().replace(/^s_/, '')
  // 直接命中映射表
  if (NAME_MAP[q]) return NAME_MAP[q]
  // 包含式匹配（如「贵州茅台走势」）
  for (const [name, code] of Object.entries(NAME_MAP)) {
    if (q.includes(name)) return code
  }
  // 在线建议补全（best-effort）
  return null // 在线解析在 onRequest 内异步尝试
}

async function suggestCode(q) {
  try {
    const enc = encodeURIComponent(q)
    const url = `https://suggest3.sinajs.cn/suggest/${enc}.html?_switch=1&key=${enc}`
    const res = await fetch(url, { headers: { Referer: SINA_REF } })
    const buf = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buf)
    const mm = text.match(/suggestvalue="([^"]*)"/)
    if (!mm) return null
    for (const part of mm[1].split(';')) {
      const cols = part.split(',')
      // 列顺序：名称, 类型, 数字代码, 带前缀代码(shortcode), 全称…
      const full = (cols[3] || '').replace(/^s_/, '').trim()
      if (/^(sh|sz|bj)\d{6}$/i.test(full)) return full.toLowerCase()
      // 退化：数字代码 + 类型前缀（11/21/13/31→sh，12/22/23/33→sz）
      const num = (cols[2] || '').trim()
      const tp = (cols[1] || '').trim()
      const prefix = { '11': 'sh', '12': 'sz', '13': 'sh', '21': 'sh', '22': 'sz', '23': 'sz', '31': 'sh', '33': 'sz' }[tp]
      if (/^\d{6}$/.test(num) && prefix) return (prefix + num).toLowerCase()
    }
  } catch {}
  return null
}

// —— 抓取 A 股日线 K 线（含 A 股指数），带重试（Sina 偶发限流/截断时自愈）——
async function fetchDaily(symbol, tries = 3) {
  const code = symbol.toLowerCase()
  const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=240&ma=5,10,20&datalen=500`
  let last = []
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Referer: SINA_REF } })
      const buf = await res.arrayBuffer()
      const text = new TextDecoder('gbk').decode(buf)
      const arr = JSON.parse(text || '[]')
      if (!Array.isArray(arr)) continue
      const bars = arr.map(d => ({
        day: d.day || '',
        open: parseFloat(d.open), high: parseFloat(d.high), low: parseFloat(d.low), close: parseFloat(d.close),
      })).filter(d => d.open && d.close && d.day)
      const months = new Set(bars.map(b => (b.day || '').slice(0, 7)))
      // 健康数据：足量日线 + 覆盖多月；否则视为 Sina 偶发截断（只返回最近一个月），重试
      if (bars.length >= 20 && months.size >= 6) return bars
      last = bars
    } catch {}
    if (i < tries - 1) await new Promise(r => setTimeout(r, 250 * (i + 1)))
  }
  return last
}

function weekKey(day) {
  const d = new Date(day)
  if (isNaN(d)) return day
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

function aggregate(bars, keyFn, n) {
  const groups = new Map()
  for (const b of bars) {
    const k = keyFn(b)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(b)
  }
  const out = []
  for (const [, g] of groups) {
    out.push({
      day: g[g.length - 1].day,
      open: g[0].open, high: Math.max(...g.map(x => x.high)),
      low: Math.min(...g.map(x => x.low)), close: g[g.length - 1].close,
    })
  }
  return out.slice(-n)
}

// —— 价格结构研判框架（中性化，通用标的）——
const STRUCT_PROMPT = `你是一名价格结构研判助手。请基于提供的多周期 K 线数据，采用"自顶向下、结构优先"的研判方法分析该标的的趋势、关键位与触发条件。

# 研判方法（结构优先，须逐条应用）
1. 多周期自顶向下：先看月线定大背景（牛/熊/区间），再看周线定中期偏向，最后看日线找具体触发。上级周期约束下级——月线处于区间时，周线的突破需谨慎；周线处于趋势时，日线的逆势回调多为机会。
2. 趋势与区间识别：连续更高的高点与低点=趋势多头；连续更低的高点与低点=趋势空头；高低点横向重叠=交易区间。强趋势中回调稀少、常有"紧迫感"、常数根不回踩均线；弱趋势回撤深、十字星多。以最近若干根 K 线的极点判断，勿被单根误导。
3. K 线结构语言：大实体顺向棒=动能强，顺向突破更可信；小实体、长影线、十字星=犹豫，常在拐点或区间边缘。区分"信号棒"（埋伏笔那根）与"触发棒"（下一根突破其极值才成交）。
4. 通道与测量移动：趋势常以"尖峰+通道"运行——先一波急涨/急跌（尖峰），随后沿平行线推进。一波"测量移动"的目标幅度约等于第一腿（尖峰）的幅度；到达目标后警惕回调或反转。缺口判定：若突破后的回撤不回到突破根极值，为"测量缺口"，预示该腿≈前腿幅度、趋势延续；若回撤回到突破起点，则更可能是"竭尽缺口"。
5. 三推与楔形：三次更高的摆动高点或三次更低的摆动低点=三推，交易逻辑等同于楔形；尖峰+通道常在第三推后向通道另一侧回撤（常测至通道下沿/上沿）。
6. 关键价位（磁场）：前高/前低、区间上下沿、近期均线、整数关口为磁场位——价格倾向靠近、测试、反转或加速突破。
7. 反转与失效的精确判定：
   - 主趋势反转：必须同时出现（a）趋势线被跌破/突破，且（b）随后对旧趋势极值进行测试（刺穿或收回）。仅其一通常只是回调，不是反转。
   - 末旗：每段趋势结束前常出现一段小旗形；末旗后易转区间或反向。
   - 高潮/竭尽：一波在极少根数内走出极大幅度后，几乎必有回撤；若回撤收回超过原趋势的 75%，则更宜视为新趋势而非旧趋势的回调。极强突破出现在趋势末端时，成功率常低于 30%，多转为竭尽缺口，随后至少"两腿、约十根"的向均线回撤。
   - 回调买点（顺势）：在多头旗形或区间下沿数"高1/高2"——高1=回调中高于前一根的高；高2=再次更低后、下一根创更高的高，为最常用的顺势回调买点（高3 是楔形变体）。空头对称用"低1/低2"。回撤依序在 棒→次级趋势线→均线→均线缺口→主趋势线 处获得支撑/阻力。
8. 触发与计划：给出"若站上 X 则…；若跌破 Y 则…"的具体触发，以及合理止损位与盈亏比参考。任何研判都只是概率，必须给出明确失效条件；不替用户做买卖决定，只做分析。

# 数据如实原则（务必遵守）
- 必须严格依据所提供 K 线的【实际条数】陈述：若月线明确给出 18 根、周线 26 根，则按此条数研判，严禁臆断"月线仅 1 根""数据不足""只有一根 K 线"等结论。
- 只有在上游确实只返回极少根数（如月线 ≤2 根）时，才如实说明数据受限；数据齐全时不得凭空声称样本不足。
- 报告应基于真实区间陈述（如"近 18 个月月线处于…"），用提供的数据佐证，不得臆造样本不足。

# 输出结构（请严格按此格式，用中文，简洁）
【大周期背景】月线当前处于什么状态，关键价位区间
【中期偏向】周线偏向与置信度（高/中/低）
【日线结构】日线最近结构，是否处于通道/区间/三推/突破中
【关键价位】上方阻力 / 下方支撑（给具体数值区间）
【今日触发】具体条件与对应动作（站上/跌破）
【研判逻辑】3-5 条白话推理链（须引用上述结构依据，如测量移动目标、三推楔形、高2买点、主趋势反转条件、75% 回撤阈值等）
【风险与失效】什么情况证明研判错了`

function compact(bars, n) {
  if (!bars || !bars.length) return '(无数据)'
  return bars.slice(-n).map((b) => {
    const t = (b.day || '').slice(0, 10)
    return `${t} O:${b.open} H:${b.high} L:${b.low} C:${b.close}`
  }).join('\n')
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405 })

  const apiKey = env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '分析服务未配置' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  let { query, pwd } = await request.json().catch(() => ({}))

  const validHash = env.AI_ANALYSIS_PASS
  if (validHash && pwd !== validHash) {
    return new Response(JSON.stringify({ error: '分析密码错误' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: '请输入分析问题' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  // 解析标的代码（名字→代码）
  let code = resolveCode(query)
  if (!code) code = await suggestCode(query)

  // —— 路径 A：有 K 线 → 价格结构研判（上段）——
  if (code) {
    try {
      const daily = await fetchDaily(code)
      const monthsCount = new Set(daily.map(b => (b.day || '').slice(0, 7))).size
      if (daily.length >= 20 && monthsCount >= 6) {
        const month = aggregate(daily, b => (b.day || '').slice(0, 7), 18)
        const week = aggregate(daily, b => weekKey(b.day), 26)
        const m0 = month[0]?.day?.slice(0, 7) || ''
        const m1 = month[month.length - 1]?.day?.slice(0, 7) || ''
        const user = `以下是标的 ${code} 的 K 线数据（数据齐全）。请按价格结构研判方法，自顶向下(月→周→日)做趋势研判。

【月线】本次实际获取 ${month.length} 根，区间 ${m0} 至 ${m1}，展示如下：
${compact(month, 18)}

【周线】本次实际获取 ${week.length} 根，展示如下：
${compact(week, 26)}

【日线】最近 40 根：
${compact(daily, 40)}

请给出结构化研判报告（前 4 段为结构研判，后 3 段为计划与风控）。`

        const dsRes = await fetch(DEEPSEEK_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: STRUCT_PROMPT },
              { role: 'user', content: user },
            ],
            stream: true, temperature: 0.5, max_tokens: 4096,
          }),
        })
        if (dsRes.ok) {
          return new Response(dsRes.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache', Connection: 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
      }
    } catch (e) { /* 落到文本路径 */ }
  }

  // —— 无 K 线 / 解析失败：价格结构研判不可用，返回说明占位（下段由产业链瓶颈分析接口提供）——
  const note = '【价格结构研判】本框架需基于 K 线数据。当前输入未能解析到可交易标的或暂无足够历史 K 线，价格结构研判暂不可用；请参考下方「产业链瓶颈分析」。'
  const sseNote = `data: ${JSON.stringify({ choices: [{ delta: { content: note } }] })}\n\ndata: [DONE]\n\n`
  return new Response(sseNote, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache', Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
