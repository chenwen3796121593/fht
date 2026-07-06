import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar'
import { useApp } from '../context/AppContext.jsx'
import { Bell, Vibrate, Volume2, Plus, Trash2, Zap, Send, Loader2, TrendingUp, RefreshCw } from 'lucide-react'
import { DEFAULT_WATCHLIST } from '../lib/constants.js'

const MI = { push: Bell, vibrate: Vibrate, voice: Volume2 }

function loadAlerts() { try { return JSON.parse(localStorage.getItem('fh_alerts') || '[]') } catch { return [] } }
function saveAlerts(a) { localStorage.setItem('fh_alerts', JSON.stringify(a)) }

function getWatchList() {
  try { const custom = JSON.parse(localStorage.getItem('fh_custom') || '[]'); return [...DEFAULT_WATCHLIST, ...(Array.isArray(custom) ? custom : [])] } catch(e) { return DEFAULT_WATCHLIST }
}

async function requestPushPerm() {
  if (!('Notification' in window) || Notification.permission === 'granted' || Notification.permission === 'denied') return
  await Notification.requestPermission()
}

// =========== 预警面板 ===========
function AlertsPanel({ prices }) {
  const rawList = getWatchList()
  const watchList = rawList.map(w => ({ ...w, displayName: prices[w.symbol]?.name || w.name }))
  const [alerts, setAlerts] = useState(loadAlerts)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ symbol: 'hf_XAU', name: '现货黄金', type: 'pct', value: 5, methods: ['push'] })

  useEffect(() => { saveAlerts(alerts) }, [alerts])

  const addAlert = () => {
    if (!form.value) return
    setAlerts([...alerts, { ...form, id: Date.now(), active: true, triggered: null }])
    setShowForm(false)
    setForm({ symbol: 'hf_XAU', name: '现货黄金', type: 'pct', value: 5, methods: ['push'] })
  }

  const toggleAlert = (id) => setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a))
  const deleteAlert = (id) => setAlerts(alerts.filter(a => a.id !== id))

  const toggleMethod = (m) => {
    if (m === 'push' && !form.methods.includes('push')) requestPushPerm()
    setForm(f => ({ ...f, methods: f.methods.includes(m) ? f.methods.filter(x => x !== m) : [...f.methods, m] }))
  }

  return (
    <div>
      <div className="pt-3 pb-3 flex justify-start">
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#3B82F6] text-white flex items-center gap-1 active:scale-95 transition-all"><Plus size={14} /> 新建预警</button>
      </div>
      {showForm && (
        <div className="pb-3">
          <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5 flex flex-col gap-3">
            <select className="bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none w-full truncate" value={form.symbol} onChange={e => { const s = watchList.find(w => w.symbol === e.target.value); setForm({ ...form, symbol: e.target.value, name: s?.displayName || s?.name || '' }) }}>
              {watchList.map(w => <option key={w.symbol} value={w.symbol}>{w.displayName}</option>)}
            </select>
            <div className="flex gap-2">
              <select className="bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="pct">涨跌幅超过</option><option value="price_up">价格突破</option><option value="price_down">价格跌破</option>
              </select>
              <input className="w-20 bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none text-center" type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              <span className="text-sm text-[#8D949E] self-center">{form.type === 'pct' ? '%' : '$'}</span>
            </div>
            <div className="flex gap-2">
              {['push', 'vibrate', 'voice'].map(m => { const I = MI[m]; const active = form.methods.includes(m); return <button key={m} onClick={() => toggleMethod(m)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}><I size={14} /> {m === 'push' ? '推送' : m === 'vibrate' ? '震动' : '语音'}</button> })}
            </div>
            <button onClick={addAlert} className="bg-[#3B82F6] text-white py-2.5 rounded-md text-sm font-medium active:scale-[0.98] transition-all">确认添加</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 pb-8">
        {alerts.length === 0 && <div className="text-center text-[#4D545C] text-sm py-8">暂无预警，点击右上角 + 新建</div>}
        {alerts.map((a) => (
          <div key={a.id} className="bg-[#12161C] rounded-lg p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${a.active ? 'text-[#F0F2F5]' : 'text-[#4D545C]'}`}>{a.name} <span className="text-[11px] text-[#6B7280]">{a.symbol}</span></span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAlert(a.id)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${a.active ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#4D545C]/20 text-[#4D545C]'}`}><div className={`w-3 h-3 rounded-full ${a.active ? 'bg-[#22C55E]' : 'bg-[#4D545C]'}`} /></button>
                <button onClick={() => deleteAlert(a.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#4D545C] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="text-xs text-[#8D949E]">
              {a.type === 'pct' ? `涨跌幅超过 ±${a.value}%` : a.type === 'price_up' ? `价格突破 $${a.value}` : `价格跌破 $${a.value}`}
              {a.triggered && <span className="text-[#3B82F6] ml-2">上次触发：{a.triggered}</span>}
            </div>
            {a.methods.length > 0 && <div className="flex gap-2 text-[#6B7280]">{a.methods.map((m) => { const I = MI[m]; return <I key={m} size={13} /> })}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// =========== AI 分析面板 ===========
function AiPanel() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwd, setPwd] = useState('')
  const [showPwdInput, setShowPwdInput] = useState(true)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [response])

  const savePwd = async () => {
    if (!pwd.trim()) return
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
    try {
      const res = await fetch('/api/verify-pwd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) })
      if (res.ok) { setShowPwdInput(false); setPwdErr('') }
      else setPwdErr('密码错误，请重试')
    } catch { setPwdErr('验证失败，请重试') }
  }

  const handleAnalyze = async () => {
    if (!query.trim() || loading) return
    if (!pwd) { setShowPwdInput(true); return }
    setLoading(true)
    setResponse('')
    setError('')

    // 前端 SHA-256 哈希，密码不离开浏览器
    const pwdHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), pwd: pwdHash }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // 解析 SSE: data: {"choices":[{"delta":{"content":"..."}}]}
        const lines = buffer.split('\n')
        buffer = lines.pop() // 最后一个可能不完整，留到下次

        for (const line of lines) {
          if (!line.startsWith('data: ') || line.startsWith('data: [DONE]')) continue
          try {
            const json = JSON.parse(line.slice(6))
            const content = json?.choices?.[0]?.delta?.content
            if (content) setResponse(prev => prev + content)
          } catch {}
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze() }
  }

  const examples = [
    'A股 AI半导体 产业链卡点在哪里？',
    '沪金 hf_XAU 当前价格怎么看？',
    '光模块 CPO 产业链，哪些环节最值得研究？',
    '机器人的核心供应链瓶颈是什么？',
  ]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* 密码栏 */}
      {showPwdInput && (
        <div className="pt-3 pb-2">
          <div className="bg-[#12161C] border border-[#3B82F6]/30 rounded-lg p-3 flex items-center gap-2">
            <input
              type="password"
              className="flex-1 bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none"
              placeholder="VIP 分析密码"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setPwdErr('') }}
              onKeyDown={e => e.key === 'Enter' && savePwd()}
            />
            <button onClick={savePwd} disabled={!pwd.trim()} className="px-4 py-2 rounded-md bg-[#3B82F6] text-white text-xs font-medium disabled:opacity-40 whitespace-nowrap">确认</button>
          </div>
          {pwdErr && <div className="text-[11px] text-[#EF4444] mt-1 text-center">{pwdErr}</div>}
          {!pwdErr && <div className="text-[10px] text-[#6B7280] mt-1 text-center">AI 深度分析为 VIP 专享，开通 VIP 请联系管理员</div>}
        </div>
      )}

      {/* 输入区 */}
      <div className="pt-3 pb-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 bg-[#12161C] border border-[#242B33] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] outline-none placeholder-[#4D545C] resize-none"
            rows={3}
            placeholder="输入股票代码、行业主题或投资问题…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {examples.map((ex, i) => (
              <button key={i} onClick={() => setQuery(ex)} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A2129] text-[#6B7280] hover:text-[#8D949E] transition-colors">{ex}</button>
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all ${loading || !query.trim() ? 'bg-[#1A2129] text-[#4D545C]' : 'bg-[#3B82F6] text-white'}`}
          >
            {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Send size={14} className="shrink-0" />}
            <span className="whitespace-nowrap">{loading ? '分析中…' : '分析'}</span>
          </button>
        </div>
      </div>

      {/* 结果区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6">
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-3 text-sm text-[#EF4444]">{error}</div>
        )}
        {response && (
          <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-4">
            <div className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-wrap">{response}</div>
            {loading && <span className="inline-block w-2 h-4 bg-[#3B82F6] ml-0.5 animate-pulse rounded-sm" />}
          </div>
        )}
        {!response && !error && !loading && (
          <div className="text-center text-[#4D545C] text-sm py-12 flex flex-col items-center gap-2">
            <Zap size={28} className="text-[#4D545C]" />
            <p>输入行业主题或股票代码，<br />AI 用供应链瓶颈框架深度分析</p>
          </div>
        )}
      </div>
    </div>
  )
}

// =========== 预测大模型面板 ===========
const STOCK_MODELS = [
  { key: 'kronos', name: 'Kronos-sm A股精选', file: 'ranking.json', periods: null, isKronos: true },
  { key: 'timesfm', name: 'TimesFM A股精选', file: 'timesfm_ranking.json', periods: ['30d','60d','128d'], showCode: false, showTarget: false, showPct: true },
  { key: 'timesfm_full', name: 'TimesFM A股全量', file: 'timesfm_full_ranking.json', periods: ['30d','60d','128d'], showCode: false, showTarget: false, showPct: true },
]
const COMMODITY_MODELS = [
  { key: 'lightgbm', name: 'LightGBM全量A股', raw: 'https://raw.githubusercontent.com/chenheping1974/khquant/main/results/latest.json', periods: null, isLgbm: true, rows: 30 },
  { key: 'commodity', name: 'Chronos-2 商品', file: 'commodity_ranking.json', periods: ['7d','14d','30d'], showCode: false, showTarget: true, showPct: false },
  { key: 'moirai', name: 'Moirai-2 商品', file: 'moirai_ranking.json', periods: ['7d','14d','30d','60d','90d'], showCode: false, showTarget: true, showPct: false, transpose: true },
]
const ALL_MODELS = [...STOCK_MODELS, ...COMMODITY_MODELS]
const DATA_PROXY = '/api/predict-data'

function PredictPanel() {
  const [pwd, setPwd] = useState('')
  const [showPwdInput, setShowPwdInput] = useState(true)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [activeModel, setActiveModel] = useState('commodity')
  const [iframeUrl, setIframeUrl] = useState('')
  const [hfSite, setHfSite] = useState('')

  const savePwd = async () => {
    if (!pwd.trim()) return
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
    try {
      const res = await fetch('/api/verify-pwd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) })
      if (res.ok) { setShowPwdInput(false); setPwdErr(''); fetchAll() }
      else setPwdErr('密码错误，请重试')
    } catch { setPwdErr('验证失败，请重试') }
  }

  const fetchAll = async () => {
    if (!pwd) { setShowPwdInput(true); return }
    setLoading(true)
    setError('')
    const results = {}
    try {
      await Promise.all(ALL_MODELS.map(async (m) => {
        try {
          const t = Date.now()
          const params = m.raw ? `raw=${encodeURIComponent(m.raw)}&t=${t}` : `file=${m.file}&t=${t}`
          const res = await fetch(`${DATA_PROXY}?${params}`)
          results[m.key] = await res.json()
        } catch (e) { results[m.key] = null }
      }))
      setData(results)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }


  const toggleExpand = (k) => setExpanded(prev => ({ ...prev, [k]: !prev[k] }))

  const Pct = ({ v }) => {
    if (v == null) return <span className="text-[#4D545C]">--</span>
    const c = v > 0 ? '#EF4444' : v < 0 ? '#22C55E' : '#8D949E'
    return <span style={{ color: c }}>{v > 0 ? '+' : ''}{v.toFixed(1)}%</span>
  }

  const fmtVal = (v) => v?.toFixed?.(2) ?? v ?? '--'
  const fmtPrice = (v) => typeof v === 'number' ? v.toFixed(2) : (v ?? '--')

  // 目标价 vs 现价颜色
  const targetColor = (current, target) => {
    if (!current || !target) return '#8D949E'
    return target > current ? '#EF4444' : target < current ? '#22C55E' : '#8D949E'
  }

  // 多周期数据合并：以第一个周期为基准，补入其他周期数据
  const mergePeriods = (rankings, periods) => {
    if (!periods?.length) return []
    const primary = rankings[periods[0]] || []
    const map = {}
    // 先加载所有周期的数据
    for (const p of periods) {
      for (const item of rankings[p] || []) {
        const key = item.symbol || item.code
        if (!map[key]) map[key] = { symbol: key, name: item.name || '', code: item.code || '', current: item.current || item.last_close || 0 }
        map[key][`t_${p}`] = item.target
        map[key][`p_${p}`] = item.pct != null ? item.pct : item.pct_change
      }
    }
    // 按主周期顺序输出（保证 Top50 对应主周期排名）
    const ordered = []
    const seen = new Set()
    for (const item of primary) {
      const key = item.symbol || item.code
      if (!seen.has(key) && map[key]) { seen.add(key); ordered.push(map[key]) }
    }
    // 补上其他周期独有的（排在后面）
    for (const key of Object.keys(map)) {
      if (!seen.has(key)) ordered.push(map[key])
    }
    return ordered
  }

  // Kronos-sm 扁平排名数组
  const getKronosItems = (d, m) => (d?.ranking || []).slice(0, m.rows || 50)

  // 获取数据日期
  const getDate = (d) => d?.updated || d?.data_date || ''
  const latestDate = Object.values(data).map(getDate).filter(Boolean).sort().pop() || ''

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {showPwdInput && (
        <div className="pt-3 pb-2">
          <div className="bg-[#12161C] border border-[#3B82F6]/30 rounded-lg p-3 flex items-center gap-2">
            <input type="password" className="flex-1 bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none" placeholder="VIP 分析密码" value={pwd} onChange={e => { setPwd(e.target.value); setPwdErr('') }} onKeyDown={e => e.key === 'Enter' && savePwd()} />
            <button onClick={savePwd} disabled={!pwd.trim()} className="px-4 py-2 rounded-md bg-[#3B82F6] text-white text-xs font-medium disabled:opacity-40 whitespace-nowrap">确认</button>
          </div>
          {pwdErr && <div className="text-[11px] text-[#EF4444] mt-1 text-center">{pwdErr}</div>}
          {!pwdErr && <div className="text-[10px] text-[#6B7280] mt-1 text-center">预测大模型为 VIP 专享，开通 VIP 请联系管理员</div>}
        </div>
      )}

      {!showPwdInput && <>
      {/* 模型标签 — 第一排股票，第二排商品+刷新 */}
      <div className="flex flex-col gap-1 pt-3">
        <div className="flex gap-1 flex-wrap">
          {STOCK_MODELS.map(m => (
            <button key={m.key} onClick={() => { setActiveModel(m.key); setHfSite('') }}
              className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${activeModel === m.key && !hfSite ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          {COMMODITY_MODELS.map(m => (
            <button key={m.key} onClick={() => { setActiveModel(m.key); setHfSite('') }}
              className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${activeModel === m.key && !hfSite ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
              {m.name}
            </button>
          ))}
          <button onClick={async () => { try { const r = await fetch('/api/hf-proxy?site=timesfm'); const j = await r.json(); setIframeUrl(j.url); setHfSite('timesfm') } catch(e) {} }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${hfSite === 'timesfm' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            TimesFM+Moirai
          </button>
          <button onClick={async () => { try { const r = await fetch('/api/hf-proxy?site=chronos'); const j = await r.json(); setIframeUrl(j.url); setHfSite('chronos') } catch(e) {} }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${hfSite === 'chronos' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            Chronos+Kronos
          </button>
          <button onClick={fetchAll} disabled={loading} className="px-2 py-1 rounded text-[10px] font-medium bg-[#3B82F6] text-white flex items-center gap-1 active:scale-95 transition-all disabled:opacity-40">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <span className="text-[10px] text-[#6B7280]">{latestDate ? `更新: ${latestDate.slice(5, 16).replace('T', ' ')}` : ''}</span>
        </div>
      </div>

      {/* 选中模型的表格 / iframe */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '0.5rem' }}>
        {error && <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-3 text-sm text-[#EF4444] mb-2">{error}</div>}
        {iframeUrl ? (
          <div className="flex flex-col h-full mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#6B7280]">外部模型页面</span>
              <button onClick={() => { setIframeUrl(''); setHfSite('') }} className="px-2 py-0.5 rounded text-[10px] bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5]">关闭</button>
            </div>
            <iframe src={iframeUrl} className="flex-1 w-full border-0 rounded-lg" style={{ height: 'calc(100vh - 260px)' }} title="模型页面" />
          </div>
        ) :
        ALL_MODELS.filter(m => m.key === activeModel).map(m => {
          const d = data[m.key]
          if (!d) return <div key={m.key} className="text-center text-[#4D545C] text-sm py-8">{pwd ? '加载中...' : '请先输入 VIP 密码'}</div>
          const periods = m.periods
          const isStock = STOCK_MODELS.some(s => s.key === m.key)

          // Moirai-2 转置表格
          if (m.transpose) {
            const rankings = d?.rankings || {}
            const allItems = mergePeriods(rankings, periods)
            const rows = ['current', ...periods]
            const rowLabels = { current: '现价' }
            periods.forEach(p => { rowLabels[p] = `${p}目标` })

            return (
              <div key={m.key} className="bg-[#12161C] border border-[#242B33] rounded-lg overflow-hidden mt-2">
                <div className="overflow-x-auto">
                  <table className="text-[11px]">
                    <thead>
                      <tr className="text-[#6B7280] border-b border-[#242B33]">
                        <th className="text-left px-1.5 py-1.5 font-normal bg-[#0D1117] sticky left-0 z-10">品种</th>
                        {allItems.map(item => (
                          <th key={item.symbol} className="px-1.5 py-1.5 font-normal text-[11px]" style={{ maxWidth: '3em', wordBreak: 'break-all', lineHeight: '1.2' }}>{item.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(rowKey => (
                        <tr key={rowKey} className="border-b border-[#1A2129]">
                          <td className="px-2 py-1.5 text-[#6B7280] bg-[#0D1117] sticky left-0 whitespace-nowrap">{rowLabels[rowKey] || rowKey}</td>
                          {allItems.map(item => (
                            <td key={item.symbol} className="text-center px-1.5 py-1.5 tabular-nums text-[11px]"
                              style={{ color: rowKey === 'current' ? '#D1D5DB' : targetColor(item.current, item[`t_${rowKey}`]) }}>
                              {rowKey === 'current' ? fmtPrice(item.current) : fmtVal(item[`t_${rowKey}`])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }

          // 普通表格
          const merged = (m.isKronos || m.isLgbm) ? null : mergePeriods(d?.rankings || {}, periods)
          const items = m.isLgbm ? (d?.top30 || []).slice(0, m.rows) : (m.isKronos ? getKronosItems(d, m) : merged.slice(0, 50))

          return (
            <div key={m.key} className="bg-[#12161C] border border-[#242B33] rounded-lg overflow-hidden mt-2">
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 215px)' }}>
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-[#0D1117]">
                    {m.isLgbm ? (
                      <tr className="text-[#6B7280] border-b border-[#242B33]">
                        <th className="text-center px-1 py-1.5 font-normal w-6">#</th>
                        <th className="text-left px-2 py-1.5 font-normal">名称</th>
                        <th className="text-left px-1 py-1.5 font-normal">代码</th>
                        <th className="text-left px-1 py-1.5 font-normal">行业</th>
                        <th className="text-right px-2 py-1.5 font-normal">综合分</th>
                        <th className="text-right px-2 py-1.5 font-normal">价值EP</th>
                        <th className="text-right px-2 py-1.5 font-normal">动量</th>
                        <th className="text-right px-2 py-1.5 font-normal">质量ROE</th>
                      </tr>
                    ) : m.isKronos ? (
                      <tr className="text-[#6B7280] border-b border-[#242B33]">
                        <th className="text-center px-1 py-1.5 font-normal w-6">#</th>
                        <th className="text-left px-2 py-1.5 font-normal">名称</th>
                        <th className="text-left px-1 py-1.5 font-normal">代码</th>
                        <th className="text-right px-2 py-1.5 font-normal">收盘价</th>
                        <th className="text-right px-2 py-1.5 font-normal">预测价</th>
                        <th className="text-right px-2 py-1.5 font-normal">30d涨幅</th>
                      </tr>
                    ) : (
                      <tr className="text-[#6B7280] border-b border-[#242B33]">
                        <th className="text-center px-1 py-1.5 font-normal w-6">#</th>
                        <th className="text-left px-2 py-1.5 font-normal">名称</th>
                        {isStock && <th className="text-left px-1 py-1.5 font-normal">代码</th>}
                        <th className="text-right px-2 py-1.5 font-normal">现价</th>
                        {m.showTarget && periods.map(p => <th key={p} className="text-right px-2 py-1.5 font-normal">{p}目标</th>)}
                        {m.showPct && periods.map(p => <th key={`${p}p`} className="text-right px-2 py-1.5 font-normal">{p}涨幅</th>)}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b border-[#1A2129] hover:bg-[#1A2129]/50">
                        <td className="text-center px-1 py-1.5 text-[#4D545C]">{i + 1}</td>
                        <td className="px-2 py-1.5 text-[#D1D5DB] whitespace-nowrap">{item.name}</td>
                        {isStock && <td className="px-1 py-1.5 text-[#4D545C]">{item.code || item.symbol || ''}</td>}
                        <td className="text-right px-2 py-1.5 text-[#D1D5DB] tabular-nums">{fmtPrice(item.current || item.last_close)}</td>
                        {m.isLgbm ? (
                          <>
                            <td className="px-1 py-1.5 text-[#4D545C]">{item.industry || ''}</td>
                            <td className="text-right px-2 py-1.5 text-[#F0F2F5] tabular-nums font-medium">{item.score?.toFixed(3) || '--'}</td>
                            <td className="text-right px-2 py-1.5 tabular-nums" style={{ color: (item.factors?.value_ep||0)>0 ? '#EF4444' : '#22C55E' }}>{item.factors?.value_ep?.toFixed(3) || '--'}</td>
                            <td className="text-right px-2 py-1.5 tabular-nums" style={{ color: (item.factors?.momentum_12m1m||0)>0 ? '#EF4444' : '#22C55E' }}>{item.factors?.momentum_12m1m?.toFixed(3) || '--'}</td>
                            <td className="text-right px-2 py-1.5 tabular-nums" style={{ color: (item.factors?.quality_roe||0)>0 ? '#EF4444' : '#22C55E' }}>{item.factors?.quality_roe?.toFixed(3) || '--'}</td>
                          </>
                        ) : m.isKronos ? (
                          <>
                            <td className="text-right px-2 py-1.5 text-[#D1D5DB] tabular-nums">{fmtPrice(item.pred_close)}</td>
                            <td className="text-right px-2 py-1.5 tabular-nums font-medium"><Pct v={item.pct_change} /></td>
                          </>
                        ) : (
                          <>
                            {m.showTarget && periods.map(p => <td key={p} className="text-right px-2 py-1.5 tabular-nums" style={{ color: targetColor(item.current, item[`t_${p}`]) }}>{fmtVal(item[`t_${p}`])}</td>)}
                            {m.showPct && periods.map(p => <td key={`${p}p`} className="text-right px-2 py-1.5 tabular-nums font-medium"><Pct v={item[`p_${p}`]} /></td>)}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </>
    }
    </div>
  )
}

// =========== 主页面 ===========
export default function AlertsPage() {
  const { prices } = useApp()
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem('fh_ai_tab') || 'predict' } catch { return 'predict' }
  })

  const switchTab = (t) => { setTab(t); localStorage.setItem('fh_ai_tab', t) }

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="alerts" />
      <div className="px-4">
        <div className="flex gap-1 pt-3">
          <button onClick={() => switchTab('predict')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'predict' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            <TrendingUp size={13} className="inline mr-1" />预测大模型
          </button>
          <button onClick={() => switchTab('ai')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'ai' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            <Zap size={13} className="inline mr-1" />AI分析
          </button>
          <button onClick={() => switchTab('alerts')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'alerts' ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
            <Bell size={13} className="inline mr-1" />预警
          </button>
        </div>
        {tab === 'alerts' ? <AlertsPanel prices={prices} /> : tab === 'ai' ? <AiPanel /> : <PredictPanel />}
      </div>
    </div>
  )
}
