import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { Bell, Vibrate, Volume2, Plus, Trash2 } from 'lucide-react'

const MI = { push: Bell, vibrate: Vibrate, voice: Volume2 }

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem('fh_alerts') || '[]') } catch { return [] }
}
function saveAlerts(a) { localStorage.setItem('fh_alerts', JSON.stringify(a)) }

const DEFAULT_WATCH = [
  { symbol: 'hf_XAU', name: '现货黄金' },
  { symbol: 'hf_XAG', name: '现货白银' },
  { symbol: 'hf_CL', name: '国际原油' },
  { symbol: 'hf_HG', name: 'COMEX铜' },
  { symbol: 'hf_AHD', name: 'LME铝' },
]

function getWatchList() {
  try {
    const custom = JSON.parse(localStorage.getItem('fh_custom') || '[]')
    return [...DEFAULT_WATCH, ...custom]
  } catch(e) { return DEFAULT_WATCH }
}

export default function AlertsPage({ onNavigate }) {
  const watchList = getWatchList()
  const [alerts, setAlerts] = useState(loadAlerts)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ symbol: 'hf_XAU', name: '现货黄金', type: 'pct', value: 5, methods: ['push'] })

  useEffect(() => { saveAlerts(alerts) }, [alerts])

  const addAlert = () => {
    if (!form.value) return
    const id = Date.now()
    setAlerts([...alerts, { ...form, id, active: true, triggered: null }])
    setShowForm(false)
    setForm({ symbol: 'hf_XAU', name: '现货黄金', type: 'pct', value: 5, methods: ['push'] })
  }

  const toggleAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  const toggleMethod = (m) => {
    setForm(f => ({
      ...f,
      methods: f.methods.includes(m) ? f.methods.filter(x => x !== m) : [...f.methods, m]
    }))
  }

  return (
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="alerts" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="px-4 pb-2 flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="text-[13px] font-medium text-[#3B82F6] flex items-center gap-1">
          <Plus size={14} /> 新建预警
        </button>
      </div>

      {showForm && (
        <div className="px-4 pb-3">
          <div className="bg-[#12161C] border border-[#242B33] rounded-lg p-3.5 flex flex-col gap-3">
            <select
              className="bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none"
              value={form.symbol}
              onChange={e => {
                const s = watchList.find(w => w.symbol === e.target.value)
                setForm({ ...form, symbol: e.target.value, name: s?.name || '' })
              }}
            >
              {watchList.map(w => <option key={w.symbol} value={w.symbol}>{w.name}</option>)}
            </select>
            <div className="flex gap-2">
              <select className="bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="pct">涨跌幅超过</option>
                <option value="price_up">价格突破</option>
                <option value="price_down">价格跌破</option>
              </select>
              <input className="w-20 bg-[#1A2129] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none text-center" type="number" value={form.value}
                onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              {form.type === 'pct' ? <span className="text-sm text-[#8D949E] self-center">%</span> : <span className="text-sm text-[#8D949E] self-center">美元</span>}
            </div>
            <div className="flex gap-3">
              {['push', 'vibrate', 'voice'].map(m => {
                const I = MI[m]
                const active = form.methods.includes(m)
                return (
                  <button key={m} onClick={() => toggleMethod(m)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${active ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
                    <I size={13} /> {m === 'push' ? '推送' : m === 'vibrate' ? '震动' : '语音'}
                  </button>
                )
              })}
            </div>
            <button onClick={addAlert} className="bg-[#3B82F6] text-white py-2 rounded-md text-sm font-medium">确认添加</button>
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-3 pb-8">
        {alerts.length === 0 && (
          <div className="text-center text-[#4D545C] text-sm py-8">暂无预警，点击右上角 + 新建</div>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="bg-[#12161C] rounded-lg p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${a.active ? 'text-[#F0F2F5]' : 'text-[#8D949E]'}`}>
                  {a.name} <span className="text-[11px] text-[#4D545C]">{a.symbol}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleAlert(a.id)}
                  className={`w-3 h-3 rounded-full ${a.active ? 'bg-[#22C55E]' : 'bg-[#4D545C]'}`} />
                <button onClick={() => deleteAlert(a.id)} className="text-[#4D545C] hover:text-red-400 ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="text-xs text-[#8D949E]">
              {a.type === 'pct' ? `涨跌幅超过 ±${a.value}%` :
               a.type === 'price_up' ? `价格突破 $${a.value}` :
               `价格跌破 $${a.value}`}
              {a.triggered && <span className="text-[#3B82F6] ml-2">上次触发：{a.triggered}</span>}
            </div>
            {a.methods.length > 0 && (
              <div className="flex gap-2 text-[#6B7280]">
                {a.methods.map((m) => { const I = MI[m]; return <I key={m} size={13} /> })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
