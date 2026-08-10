import { useState, useEffect } from 'react'
import GoldKline from '../components/GoldKline'
import { useApp } from '../context/AppContext.jsx'

const INTL_MAP = {
  '黄金': { code: 'hf_XAU', name: '伦敦黄金' },
  '白银': { code: 'hf_XAG', name: '伦敦白银' },
  '铂金': { code: 'hf_XPT', name: '美铂金' },
  '钯金': { code: 'hf_XPD', name: '美钯金' },
}

const fmtChg = (c) => {
  if (c == null || c === '' || (typeof c === 'number' && isNaN(c))) return ''
  if (typeof c === 'number') return (c > 0 ? '+' : '') + c.toFixed(2)
  return String(c)
}

function VarietyRow({ r }) {
  const chg = (typeof r.change === 'number') ? r.change : 0
  const color = (chg > 0 ? 'var(--up)' : chg < 0 ? 'var(--down)' : 'var(--text)')
  const chgText = fmtChg(r.change)
  return (
    <div className="flex items-center justify-between px-3.5 py-3 transition-colors hover:bg-[var(--surface-2)]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--gold)' }} />
        <span className="text-[13px] font-medium text-[var(--text)] truncate">{r.label}</span>
      </div>
      <div className="text-right shrink-0 pl-3">
        <div className="flex items-baseline justify-end gap-1.5">
          <span className="num text-[15px] font-semibold" style={{ color }}>{r.price ?? '--'}</span>
          <span className="text-[10px] text-[var(--text-3)]">{r.unit}</span>
        </div>
        {chgText && <div className="num text-[11px] mt-0.5" style={{ color }}>{chgText}</div>}
      </div>
    </div>
  )
}

function VarietyColumn({ rows }) {
  return (
    <div className="panel overflow-hidden">
      {rows.map((r, i) => (
        <div key={r.key} className={i < rows.length - 1 ? 'border-b border-[var(--border-soft)]' : ''}>
          <VarietyRow r={r} />
        </div>
      ))}
    </div>
  )
}

export default function MetalsPage() {
  const { prices } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    const cached = localStorage.getItem('fh_metals')
    if (cached) { try { const p = JSON.parse(cached); if (p.length) setData(p) } catch {} }

    const fetchMetals = async () => {
      try {
        const res = await fetch('/api/metals?t=' + Date.now())
        const json = await res.json()
        if (!cancelled && Array.isArray(json) && json.length > 0) {
          setData(json)
          localStorage.setItem('fh_metals', JSON.stringify(json))
        }
      } catch (e) {}
    }
    fetchMetals()
    const t = setInterval(fetchMetals, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // 组装 8 个品种：国内(元/克) + 对应国际(美元/盎司)，顺序 黄金→伦敦黄金→白银→伦敦白银→铂金→美铂金→钯金→美钯金
  const metals = (data && data.length) ? data : [{}, {}, {}, {}]
  const rows = []
  metals.forEach((d) => {
    const intl = INTL_MAP[d.name]
    rows.push({ key: 'd-' + d.name, label: d.name, price: d.price, change: d.change, unit: '元/克' })
    if (intl) {
      const ip = prices[intl.code]
      rows.push({
        key: 'i-' + intl.code,
        label: intl.name,
        price: ip?.formattedPrice,
        change: ip?.change ?? 0,
        unit: '美元/盎司',
      })
    }
  })

  // 过滤无数据的国际行；单一表格展示 8 品种（左右分布）
  const visible = rows.filter((r) => r.price != null && r.price !== '--' && r.price !== '')

  return (
    <div className="flex flex-col gap-4">
      {/* 上栏：伦敦黄金 K 线图 */}
      <GoldKline priceData={prices.hf_XAU} />

      {/* 下栏：8 品种行情（单一表格，左名称右价格） */}
      <div>
        <div className="section-title mb-3">
          <span className="text-[var(--gold)]">◆</span> 贵金属行情 · 8 品种
        </div>
        <VarietyColumn rows={visible} />
      </div>
    </div>
  )
}
