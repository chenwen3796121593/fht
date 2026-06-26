import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { useApp } from '../context/AppContext.jsx'
import { Bell, Vibrate, Volume2, Plus, Trash2 } from 'lucide-react'
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

export default function AlertsPage() {
  const { prices } = useApp()
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
    <div className="overflow-y-auto bg-[#0A0F14] h-full">
      <TopBar active="alerts" />
      <div className="px-4 pt-3 pb-3 flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#3B82F6] text-white flex items-center gap-1 active:scale-95 transition-all"><Plus size={14} /> 新建预警</button>
      </div>
      {showForm && (
        <div className="px-4 pb-3">
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
      <div className="px-4 flex flex-col gap-3 pb-8">
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
