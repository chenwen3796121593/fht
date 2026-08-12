// AI 图表研判 — 抓取多周期黄金 K 线，经大模型按价格结构研判方法流式输出报告
import { getGoldKlines } from '../lib/goldData.js'

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

const SYSTEM_PROMPT = `你是一名贵金属价格结构研判助手。请基于提供的多周期 K 线数据，采用"自顶向下、结构优先"的研判方法分析伦敦黄金现货(XAU/USD，美元/盎司)的趋势、关键位与触发条件。

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

  let { pwd } = await request.json().catch(() => ({}))

  const validHash = env.AI_ANALYSIS_PASS
  if (validHash && pwd !== validHash) {
    return new Response(JSON.stringify({ error: '分析密码错误' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const [monthly, weekly, daily] = await Promise.all([
      getGoldKlines('m'),
      getGoldKlines('w'),
      getGoldKlines('d'),
    ])

    const user = `以下是伦敦黄金现货(XAU/USD，美元/盎司)的 K 线数据。请按价格结构研判方法，自顶向下(月→周→日)做趋势研判。

【月线 最近 18 根】
${compact(monthly, 18)}

【周线 最近 26 根】
${compact(weekly, 26)}

【日线 最近 40 根】
${compact(daily, 40)}

请给出结构化研判报告。`

    const dsRes = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: user },
        ],
        stream: true,
        temperature: 0.5,
        max_tokens: 4096,
      }),
    })

    if (!dsRes.ok) {
      return new Response(JSON.stringify({ error: `分析服务错误: ${dsRes.status}` }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(dsRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
