import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import MarketBar, { useMarketQuotes } from '../components/MarketBar'

function LineChart({ data, lines, width = 170, height = 110 }) {
  const p = { top: 8, right: 30, bottom: 16, left: 32 }
  const cw = width - p.left - p.right, ch = height - p.top - p.bottom
  if (!data || data.length < 2) return <div className="text-[9px] text-[#4D545C] text-center py-4">暂无数据</div>
  const allVals = lines.flatMap(l => data.map(d => d[l.key] || 0).filter(v => !isNaN(v)))
  const lo = Math.min(...allVals), hi = Math.max(...allVals), range = hi - lo || 1
  const toX = i => p.left + (i / (data.length - 1)) * cw
  const toY = v => p.top + ((hi - v) / range) * ch
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#0D1117" rx={4} />
      {[0, 0.5, 1].map(f => { const y = p.top + f * ch; return <line key={f} x1={p.left} y1={y} x2={width-p.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} /> })}
      <text x={p.left-2} y={p.top+4} fill="rgba(255,255,255,0.4)" fontSize={7} textAnchor="end">{hi.toFixed(1)}</text>
      <text x={p.left-2} y={p.top+ch+4} fill="rgba(255,255,255,0.4)" fontSize={7} textAnchor="end">{lo.toFixed(1)}</text>
      {lines.map((line, li) => (
        <polyline key={li} fill="none" stroke={line.color} strokeWidth={1} strokeDasharray={line.dash}
          points={data.map((d, i) => `${toX(i)},${toY(d[line.key]||0)}`).join(' ')} />
      ))}
    </svg>
  )
}

function IndicatorCard({ title, data, lines, rows, loading }) {
  return (
    <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-2.5 flex flex-col gap-1.5">
      <div className="text-[10px] font-medium text-[#8D949E]">{title}</div>
      {loading ? <div className="text-[9px] text-[#4D545C] py-4 text-center">加载中...</div> : <>
        <LineChart data={data} lines={lines} />
        <div className="text-[8px] text-[#6B7280] overflow-x-auto">
          <table className="w-full">
            <thead><tr>{rows.headers.map((h,i) => <th key={i} className="text-left font-normal pr-1">{h}</th>)}</tr></thead>
            <tbody>{(data||[]).slice(-5).reverse().map((d,i) => (
              <tr key={i} className="border-t border-[#1A2129]">{rows.cells.map((c,ci) => <td key={ci} className="py-0.5 pr-1">{c(d)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </>}
    </div>
  )
}

export default function IndicatorsPage({ onNavigate }) {
  const quotes = useMarketQuotes()
  const [m1m2, setM1m2] = useState(null)
  const [loan, setLoan] = useState(null)
  const [reserve, setReserve] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const [m1R, loanR, resR] = await Promise.all([
          fetch('/api/macro-data?report=CURRENCY_SUPPLY'),
          fetch('/api/macro-data?report=RMB_LOAN'),
          fetch('/api/macro-data?report=DEPOSIT_RESERVE'),
        ])
        const [m1D, loanD, resD] = await Promise.all([m1R.json(), loanR.json(), resR.json()])
        if (!cancelled) { setM1m2(m1D); setLoan(loanD); setReserve(resD); setLoading(false) }
      } catch(e) { if (!cancelled) setLoading(false) }
    }
    fetchAll()
  }, [])

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="indicators" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onIndicators={() => onNavigate('indicators')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="pt-3"><MarketBar quotes={quotes} /></div>
      <div className="px-4 py-2 grid grid-cols-2 gap-2">
        <IndicatorCard title="📊 M1/M2 货币供应" data={m1m2} lines={[{key:'m1Yoy',color:'#3B82F6'},{key:'m2Yoy',color:'#EAB308',dash:'4,2'}]} loading={loading}
          rows={{headers:['月','M1%','M2%','M1万亿'],cells:[d=>d.date?.slice(2),d=>d.m1Yoy?.toFixed(1),d=>d.m2Yoy?.toFixed(1),d=>d.m1?.toFixed(1)]}} />
        <IndicatorCard title="🏦 新增贷款" data={loan} lines={[{key:'loan',color:'#22C55E'}]} loading={loading}
          rows={{headers:['月','新增(亿)','同比%','累计万亿'],cells:[d=>d.date?.slice(2),d=>d.loan?.toFixed(0),d=>d.loanYoy?.toFixed(1),d=>d.loanAcc?.toFixed(1)]}} />
        <IndicatorCard title="📈 贷款增速" data={loan} lines={[{key:'loanYoy',color:'#3B82F6'}]} loading={loading}
          rows={{headers:['月','同比%','累计万亿',''],cells:[d=>d.date?.slice(2),d=>d.loanYoy?.toFixed(1),d=>d.loanAcc?.toFixed(1),()=>'']}} />
        <IndicatorCard title="🏛️ 准备金率" data={reserve} lines={[{key:'reserveRate',color:'#F97316'}]} loading={loading}
          rows={{headers:['日','准备金%','变动bp','上证次日'],cells:[d=>d.date,d=>d.reserveRate?.toFixed(2),d=>(d.reserveChange>0?'+':'')+d.reserveChange,d=>(d.shNext>0?'+':'')+d.shNext?.toFixed(2)+'%']}} />
      </div>
    </div>
  )
}
