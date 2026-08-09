import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { useApp } from '../context/AppContext.jsx'
import { Banknote } from 'lucide-react'

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

export default function MetalsPage({ hideTopBar }) {
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
      } catch(e) {}
    }
    fetchMetals()
    const t = setInterval(fetchMetals, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // 组装 8 个品种：国内 + 对应国际，全部竖向排列
  const metals = (data && data.length) ? data : [{}, {}, {}, {}]
  const rows = []
  metals.forEach(d => {
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

  return (
    <div className="bg-[var(--bg)] h-full flex flex-col">
      {!hideTopBar && <TopBar active="metals" />}

      <div className="px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={18} className="text-[var(--gold)]" />
          <span className="text-base font-bold text-[var(--text)]">贵金属行情</span>
          <span className="text-[10px] text-[var(--text-3)] font-normal">实时 · 8 品种</span>
        </div>

        <div className="panel overflow-hidden">
          {rows.filter(r => r.price != null && r.price !== '--' && r.price !== '').map((r, i, arr) => {
            const chg = (typeof r.change === 'number') ? r.change : 0
            const color = (chg > 0 ? 'var(--up)' : chg < 0 ? 'var(--down)' : 'var(--text)')
            const chgText = fmtChg(r.change)
            return (
              <div
                key={r.key}
                className={`flex items-center justify-between px-3.5 py-3 transition-colors hover:bg-[var(--surface-2)] ${i < arr.length - 1 ? 'border-b border-[var(--border-soft)]' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--gold)' }} />
                  <span className="text-[13px] font-medium text-[var(--text)] truncate">{r.label}</span>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="num text-[15px] font-semibold" style={{ color }}>{r.price ?? '--'}</span>
                    <span className="text-[10px] text-[var(--text-3)]">{r.unit}</span>
                  </div>
                  {chgText && (
                    <div className="num text-[11px] mt-0.5" style={{ color }}>{chgText}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-shrink-0 px-4 md:px-6 flex items-center justify-center gap-8 pb-5 mt-auto">
        <div className="text-[10px] text-[var(--text-2)] leading-relaxed text-center flex flex-col justify-center">
          <div>扫码添加微信</div>
          <div>回购黄金/铂金/钯金/银</div>
          <div>湖南省衡阳市</div>
        </div>
        <img src="/qrcode.jpg?v=2" alt="微信二维码" className="w-14 h-14 rounded-xl border border-[var(--border)] object-cover" />
      </div>
    </div>
  )
}
