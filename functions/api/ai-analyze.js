// AI 分析 — DeepSeek API 流式返回，Serenity 供应链瓶颈研究框架

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

const SYSTEM_PROMPT = `你是一个投资研究助手，采用供应链瓶颈分析框架。

## 研究方法论

1. **设定范围**：确定市场（A股/港股/美股等）、主题、时间窗口
2. **系统变化**：什么技术/经济变化驱动需求？哪个旧设计变紧绷？哪项物理约束最要命（功耗、带宽、良率、纯度、交期）？
3. **产业链映射**：下游需求 → 系统集成 → 模块/子系统 → 芯片/器件 → 工艺&封装 → 设备&测试 → 材料&耗材 → 物理基础设施
4. **找稀缺层**：供应商少、认证周期长、扩产难、材料纯度、专用设备、客户绑定、长交期——越上游越容易被忽视
5. **建公司池**：覆盖多个层级，尽量广泛扫描再精选
6. **收集证据**：优先一手来源（年报/公告/问询函/招投标/环评/专利/客户认证），其次行业媒体
7. **排序**：需求紧迫度 > 稀缺层距离 > 供应商集中度 > 扩产难度 > 证据质量 > 估值 > 风险
8. **反面论证**：什么情况说明判断错了？替代方案/竞对扩产/需求走弱/治理问题/地缘风险
9. **下一步**：具体要核实什么——文件、指标、客户交叉

## 沟通风格

- 直接给判断，不绕弯子
- 用白话解释推理链
- 对炒作保持怀疑
- 先说产业链层级，再排公司
- 用"产业链卡点"、"市场可能没看清的地方"、"优先研究名单"
- 你只做研究分析，投资决定交给用户

## 输出

主题扫描：先讲产业链稀缺层级 → 各层关键公司 → 证据和风险 → 下一步研究
个股挑战：它在产业链的准确位置 → 证据强弱 → 市场可能忽略什么 → 什么证伪
对比：按链位置、证据、稀缺性、估值、时机、风险六维对比`

// 股票代码 → CF Function 实时行情接口
const SYMBOL_PATTERN = /\b(hf_[A-Z0-9]+|sh\d{6}|sz\d{6}|bj\d{6}|hk\d{5})\b/gi

async function fetchPrice(symbol) {
  try {
    const res = await fetch(`https://fenghuotai.pages.dev/api/data?symbol=${symbol}`)
    const json = await res.json()
    return json?.price ? `${json.name || symbol}: ¥${json.price} (${json.change > 0 ? '+' : ''}${json.change}%)` : null
  } catch { return null }
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  const apiKey = env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  let { query, pwd } = await request.json()
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: '请输入分析问题' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  // 密码校验（前端传 SHA-256 哈希，后端存哈希比对）
  const validHash = env.AI_ANALYSIS_PASS
  if (validHash && pwd !== validHash) {
    return new Response(JSON.stringify({ error: '分析密码错误，VIP 用户请确认密码' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  // 检测股票代码，注入实时行情
  const codes = [...new Set(query.match(SYMBOL_PATTERN) || [])]
  if (codes.length > 0) {
    const prices = (await Promise.all(codes.map(fetchPrice))).filter(Boolean)
    if (prices.length > 0) {
      query = `${query}\n\n[当前实时行情]\n${prices.join('\n')}`
    }
  }

  try {
    const dsRes = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!dsRes.ok) {
      const err = await dsRes.text()
      return new Response(JSON.stringify({ error: `DeepSeek API 错误: ${dsRes.status} ${err}` }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      })
    }

    // 流式透传 SSE
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
