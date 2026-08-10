import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import TabDropdown from '../components/TabDropdown'

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
        const lines = buffer.split('\n')
        buffer = lines.pop()

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

  return (
    <div className="flex flex-col" style={{ minHeight: '60vh' }}>
      {showPwdInput && (
        <div className="pt-3 pb-2">
          <div className="panel p-3 flex items-center gap-2 border-[var(--gold-border)]">
            <input
              type="password"
              className="field"
              placeholder="VIP 分析密码"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setPwdErr('') }}
              onKeyDown={e => e.key === 'Enter' && savePwd()}
            />
            <button onClick={savePwd} disabled={!pwd.trim()} className="btn-gold shrink-0 disabled:opacity-40">确认</button>
          </div>
          {pwdErr && <div className="text-[11px] text-[var(--up)] mt-1.5 text-center">{pwdErr}</div>}
        </div>
      )}

      <div className="pt-3 pb-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="field resize-none"
            rows={3}
            placeholder="输入股票代码、行业主题或投资问题…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className={`btn-gold shrink-0 ${loading || !query.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{loading ? '分析中…' : '分析'}</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin pb-6">
        {error && (
          <div className="bg-[var(--up-soft)] border border-[var(--up-border)] rounded-xl p-3 text-sm text-[var(--up)]">{error}</div>
        )}
        {response && (
          <div className="panel p-4">
            <div className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">{response}</div>
            {loading && <span className="inline-block w-2 h-4 bg-[var(--gold)] ml-0.5 animate-pulse rounded-sm align-middle" />}
          </div>
        )}
      </div>
    </div>
  )
}

// =========== 大模型面板 ===========
const STOCK_MODELS = [
  { key: 'kronos', name: 'A股精选', file: 'ranking.json', periods: null, isKronos: true },
  { key: 'timesfm', name: 'A股精选(30d)', file: 'timesfm_ranking.json', periods: ['30d','60d','128d'], showCode: false, showTarget: false, showPct: true },
  { key: 'timesfm_full', name: 'A股全量', file: 'timesfm_full_ranking.json', periods: ['30d','60d','128d'], showCode: false, showTarget: false, showPct: true },
]
const COMMODITY_MODELS = [
  { key: 'lightgbm', name: '因子选股', raw: 'https://raw.githubusercontent.com/chenheping1974/khquant/main/results/latest.json', periods: null, isLgbm: true, rows: 30 },
  { key: 'moirai', name: '大宗商品', file: 'moirai_ranking.json', periods: ['7d','14d','30d','60d','90d'], showCode: false, showTarget: true, showPct: false, transpose: true },
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
      for (const m of ALL_MODELS) {
        try {
          const params = m.raw ? `raw=${encodeURIComponent(m.raw)}&v=2` : `file=${m.file}&v=2`
          const res = await fetch(`${DATA_PROXY}?${params}`)
          results[m.key] = await res.json()
        } catch (e) { results[m.key] = null }
        await new Promise(r => setTimeout(r, 1000))
      }
      setData(results)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }


  const Pct = ({ v }) => {
    if (v == null) return <span className="text-[var(--text-3)]">--</span>
    const c = v > 0 ? 'var(--up)' : v < 0 ? 'var(--down)' : 'var(--text-3)'
    return <span style={{ color: c }}>{v > 0 ? '+' : ''}{v.toFixed(1)}%</span>
  }

  const fmtVal = (v) => v?.toFixed?.(2) ?? v ?? '--'
  const fmtPrice = (v) => typeof v === 'number' ? v.toFixed(2) : (v ?? '--')

  const targetColor = (current, target) => {
    if (!current || !target) return 'var(--text-3)'
    return target > current ? 'var(--up)' : target < current ? 'var(--down)' : 'var(--text-3)'
  }

  const mergePeriods = (rankings, periods) => {
    if (!periods?.length) return []
    const primary = rankings[periods[0]] || []
    const map = {}
    for (const p of periods) {
      for (const item of rankings[p] || []) {
        const key = item.symbol || item.code
        if (!map[key]) map[key] = { symbol: key, name: item.name || '', code: item.code || '', current: item.current || item.last_close || 0 }
        map[key][`t_${p}`] = item.target
        map[key][`p_${p}`] = item.pct != null ? item.pct : item.pct_change
      }
    }
    const ordered = []
    const seen = new Set()
    for (const item of primary) {
      const key = item.symbol || item.code
      if (!seen.has(key) && map[key]) { seen.add(key); ordered.push(map[key]) }
    }
    for (const key of Object.keys(map)) {
      if (!seen.has(key)) ordered.push(map[key])
    }
    return ordered
  }

  const getKronosItems = (d, m) => (d?.ranking || []).slice(0, m.rows || 50)

  const getDate = (d) => d?.updated || d?.data_date || ''
  const latestDate = Object.values(data).map(getDate).filter(Boolean).sort().pop() || ''

  return (
    <div className="flex flex-col" style={{ minHeight: '60vh' }}>
      {showPwdInput && (
        <div className="pt-3 pb-2">
          <div className="panel p-3 flex items-center gap-2 border-[var(--gold-border)]">
            <input type="password" className="field" placeholder="VIP 分析密码" value={pwd} onChange={e => { setPwd(e.target.value); setPwdErr('') }} onKeyDown={e => e.key === 'Enter' && savePwd()} />
            <button onClick={savePwd} disabled={!pwd.trim()} className="btn-gold shrink-0 disabled:opacity-40">确认</button>
          </div>
          {pwdErr && <div className="text-[11px] text-[var(--up)] mt-1.5 text-center">{pwdErr}</div>}
        </div>
      )}

      {!showPwdInput && <>
      <div className="flex flex-col gap-1.5 pt-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <TabDropdown
            tabs={[...STOCK_MODELS, ...COMMODITY_MODELS].map(m => ({ key: m.key, label: m.name }))}
            active={hfSite ? '' : activeModel}
            onChange={(k) => { setActiveModel(k); setHfSite('') }}
          />
          <TabDropdown
            tabs={[
              { key: 'timesfm', label: 'TimesFM+Moirai' },
              { key: 'chronos', label: 'Chronos+Kronos' },
            ]}
            active={hfSite}
            onChange={async (k) => {
              try { const r = await fetch(`/api/hf-proxy?site=${k}`); const j = await r.json(); setIframeUrl(j.url); setHfSite(k) } catch(e) {}
            }}
          />
          <span className="text-[10px] text-[var(--text-3)] ml-auto">{latestDate ? `更新: ${latestDate.slice(5, 16).replace('T', ' ')}` : ''}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin" style={{ paddingBottom: '0.5rem' }}>
        {error && <div className="bg-[var(--up-soft)] border border-[var(--up-border)] rounded-xl p-3 text-sm text-[var(--up)] mb-2">{error}</div>}
        {iframeUrl ? (
          <div className="flex flex-col h-full mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[var(--text-3)]">外部模型页面</span>
              <button onClick={() => { setIframeUrl(''); setHfSite('') }} className="chip">关闭</button>
            </div>
            <iframe src={iframeUrl} className="flex-1 w-full border-0 rounded-xl min-h-[50vh]" title="模型页面" />
          </div>
        ) :
        ALL_MODELS.filter(m => m.key === activeModel).map(m => {
          const d = data[m.key]
          if (!d) return <div key={m.key} className="text-center text-[var(--text-3)] text-sm py-8">{pwd ? '加载中...' : '请先输入 VIP 密码'}</div>
          const periods = m.periods
          const isStock = STOCK_MODELS.some(s => s.key === m.key)

          if (m.transpose) {
            const rankings = d?.rankings || {}
            const allItems = mergePeriods(rankings, periods)
            const rows = ['current', ...periods]
            const rowLabels = { current: '现价' }
            periods.forEach(p => { rowLabels[p] = `${p}目标` })

            return (
              <div key={m.key} className="panel overflow-hidden mt-2">
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full">
                    <thead>
                      <tr className="text-[var(--text-3)] border-b border-[var(--border)]">
                        <th className="text-left px-1.5 py-2 font-medium bg-[var(--bg-elev)] sticky left-0 z-10">品种</th>
                        {allItems.map(item => (
                          <th key={item.symbol} className="px-1.5 py-2 font-medium text-[11px]" style={{ maxWidth: '3em', wordBreak: 'break-all', lineHeight: '1.2' }}>{item.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(rowKey => (
                        <tr key={rowKey} className="border-b border-[var(--border-soft)]">
                          <td className="px-2 py-1.5 text-[var(--text-2)] bg-[var(--bg-elev)] sticky left-0 whitespace-nowrap">{rowLabels[rowKey] || rowKey}</td>
                          {allItems.map(item => (
                            <td key={item.symbol} className="text-center px-1.5 py-1.5 num text-[11px]"
                              style={{ color: rowKey === 'current' ? 'var(--text)' : targetColor(item.current, item[`t_${rowKey}`]) }}>
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

          const merged = (m.isKronos || m.isLgbm) ? null : mergePeriods(d?.rankings || {}, periods)
          const items = m.isLgbm ? (d?.top30 || []).slice(0, m.rows) : (m.isKronos ? getKronosItems(d, m) : merged.slice(0, 50))

          return (
            <div key={m.key} className="panel overflow-hidden mt-2">
              {(!m.isLgbm && (d?.updated || d?.data_date)) && (
                <div className="px-3 py-2 text-[10px] text-[var(--text-3)] border-b border-[var(--border)] bg-[var(--bg-elev)] flex items-center gap-x-4">
                  <span>{d?.updated ? `更新: ${d.updated.slice(0,16).replace('T',' ')}` : d?.data_date ? `日期: ${d.data_date}` : ''}</span>
                  <button onClick={fetchAll} disabled={loading} className="ml-auto text-[var(--text-3)] hover:text-[var(--gold)] disabled:opacity-40">
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              )}
              <div className="overflow-y-auto scroll-thin max-h-[75vh]">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-[var(--bg-elev)]">
                    {m.isLgbm ? (
                      <tr className="text-[var(--text-3)] border-b border-[var(--border)]">
                        <th className="text-center px-1 py-2 font-medium w-6">#</th>
                        <th className="text-left px-1 py-2 font-medium">代码</th>
                        <th className="text-left px-2 py-2 font-medium">名称</th>
                        <th className="text-left px-1 py-2 font-medium">行业</th>
                        <th className="text-right px-2 py-2 font-medium">总分</th>
                      </tr>
                    ) : m.isKronos ? (
                      <tr className="text-[var(--text-3)] border-b border-[var(--border)]">
                        <th className="text-center px-1 py-2 font-medium w-6">#</th>
                        <th className="text-left px-2 py-2 font-medium">名称</th>
                        <th className="text-left px-1 py-2 font-medium">代码</th>
                        <th className="text-right px-2 py-2 font-medium">收盘价</th>
                        <th className="text-right px-2 py-2 font-medium">预测价</th>
                        <th className="text-right px-2 py-2 font-medium">30d涨幅</th>
                      </tr>
                    ) : (
                      <tr className="text-[var(--text-3)] border-b border-[var(--border)]">
                        <th className="text-center px-1 py-2 font-medium w-6">#</th>
                        <th className="text-left px-2 py-2 font-medium">名称</th>
                        {isStock && <th className="text-left px-1 py-2 font-medium">代码</th>}
                        <th className="text-right px-2 py-2 font-medium">现价</th>
                        {m.showTarget && periods.map(p => <th key={p} className="text-right px-2 py-2 font-medium">{p}目标</th>)}
                        {m.showPct && periods.map(p => <th key={`${p}p`} className="text-right px-2 py-2 font-medium">{p}涨幅</th>)}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b border-[var(--border-soft)] hover:bg-[var(--surface-2)]">
                        <td className="text-center px-1 py-1.5 text-[var(--text-3)] num">{i + 1}</td>
                        {!m.isLgbm && <td className="px-2 py-1.5 text-[var(--text)] whitespace-nowrap">{item.name}</td>}
                        {!m.isLgbm && isStock && <td className="px-1 py-1.5 text-[var(--text-3)]">{item.code || item.symbol || ''}</td>}
                        {!m.isLgbm && <td className="text-right px-2 py-1.5 text-[var(--text)] num">{fmtPrice(item.current || item.last_close)}</td>}
                        {m.isLgbm ? (
                          <>
                            <td className="px-1 py-1.5 text-[var(--text)] font-medium">{item.symbol || '--'}</td>
                            <td className="px-2 py-1.5 text-[var(--text)] whitespace-nowrap">{item.name || '--'}</td>
                            <td className="px-1 py-1.5 text-[var(--text-3)]">{item.industry || ''}</td>
                            <td className="text-right px-2 py-1.5 text-[var(--text)] num font-medium">{item.score?.toFixed(3) || '--'}</td>
                          </>
                        ) : m.isKronos ? (
                          <>
                            <td className="text-right px-2 py-1.5 text-[var(--text)] num">{fmtPrice(item.pred_close)}</td>
                            <td className="text-right px-2 py-1.5 num font-medium"><Pct v={item.pct_change} /></td>
                          </>
                        ) : (
                          <>
                            {m.showTarget && periods.map(p => <td key={p} className="text-right px-2 py-1.5 num" style={{ color: targetColor(item.current, item[`t_${p}`]) }}>{fmtVal(item[`t_${p}`])}</td>)}
                            {m.showPct && periods.map(p => <td key={`${p}p`} className="text-right px-2 py-1.5 num font-medium"><Pct v={item[`p_${p}`]} /></td>)}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {m.isLgbm && d?.data_freshness && (
                <div className="px-3 py-2 text-[10px] text-[var(--text-3)] border-t border-[var(--border)] flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-[var(--text-2)]">因子覆盖：</span>
                  {Object.entries(d.data_freshness).map(([k,v]) => (
                    <span key={k}>{k}: {v}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
    }
    </div>
  )
}

// =========== 主页面（AI 分析中心）===========
export default function AlertsPage() {
  const [pane, setPane] = useState('predict')
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const handler = (e) => setIsWide(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="page-scroll scroll-thin">
      <div className="content">
        <div className="flex items-end justify-between fade-up pt-1">
          <div>
            <div className="eyebrow hidden md:block">Analytics</div>
            <h1 className="h1 mt-0.5">AI 分析中心</h1>
          </div>
          <div className="hidden xl:flex items-center gap-4 text-[11px] text-[var(--text-3)]">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />大模型排名</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />AI 深度分析</span>
          </div>
        </div>

        {isWide ? (
          <div className="grid grid-cols-2 xl:divide-x xl:divide-[var(--border)] pb-2">
            <section className="xl:pr-5">
              <div className="section-title mb-3"><Bot size={14} className="text-[var(--gold)]" />大模型</div>
              <PredictPanel />
            </section>
            <section className="xl:pl-5">
              <div className="section-title mb-3"><Sparkles size={14} className="text-[var(--gold)]" />AI 深度分析</div>
              <AiPanel />
            </section>
          </div>
        ) : (
          <>
            <div className="subtabs">
              <button onClick={() => setPane('predict')} className={`chip flex-1 justify-center ${pane === 'predict' ? 'chip-active' : ''}`}><Bot size={13} />大模型</button>
              <button onClick={() => setPane('ai')} className={`chip flex-1 justify-center ${pane === 'ai' ? 'chip-active' : ''}`}><Sparkles size={13} />AI分析</button>
            </div>
            <div className="pb-2">
              {pane === 'predict' ? <PredictPanel /> : <AiPanel />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
