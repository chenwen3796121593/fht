import { useState, useRef, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { MessageCircle, Mic, Send } from 'lucide-react'

const SUPABASE_URL = 'https://fxpxlobftrdlswyhrnhv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nRjPbFK5D4BRzyJyh_-ahw_mivVK7Zq'
let supabase

async function getSB() {
  if (!supabase) { const { createClient } = await import('@supabase/supabase-js'); supabase = createClient(SUPABASE_URL, SUPABASE_KEY) }
  return supabase
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage({ onNavigate }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [nick, setNick] = useState(() => localStorage.getItem('fh_nick') || '')
  const [joined, setJoined] = useState(!!localStorage.getItem('fh_nick'))
  const [connected, setConnected] = useState(false)
  const initRef = useRef(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (initRef.current) return; initRef.current = true
    getSB().then(async (sb) => {
      setConnected(true)

      // Load history
      const dayAgo = new Date(Date.now() - 86400000).toISOString()
      const { data } = await sb.from('messages').select('*').gte('created_at', dayAgo).order('created_at', { ascending: true })
      if (data) setMsgs(data.map(m => ({ id: m.id, user: m.username, text: m.text, time: fmtTime(m.created_at) })))

      // Realtime subscription
      sb.channel('chat-room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new
          setMsgs(prev => {
            if (prev.find(p => p.id === m.id)) return prev
            return [...prev, { id: m.id, user: m.username, text: m.text, time: fmtTime(m.created_at) }]
          })
        })
        .subscribe()
    })
    return () => { if (supabase) supabase.removeAllChannels() }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async () => {
    const t = input.trim(); if (!t || !supabase) return
    setInput('')
    await supabase.from('messages').insert({ username: nick, text: t })
  }

  if (!joined) return (
    <div className="bg-[#0A0F14] h-full flex flex-col">
      <TopBar active="chat" onHome={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-64">
          <div className="text-center"><MessageCircle size={40} className="text-[#3B82F6] mx-auto mb-3" /><div className="text-lg font-bold text-[#F0F2F5]">烽火台聊天室</div><div className="text-xs text-[#8D949E] mt-1">{connected ? <><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />已连接</> : '连接中...'}</div></div>
          <input className="bg-[#1A2129] rounded-lg px-4 py-3 text-sm text-[#F0F2F5] outline-none" placeholder="输入昵称" value={nick} onChange={e => setNick(e.target.value)} onKeyDown={e => e.key === 'Enter' && setJoined(!!nick.trim() && (localStorage.setItem('fh_nick', nick.trim()), true))} />
          <button onClick={() => { const n = nick.trim(); if (n) { localStorage.setItem('fh_nick', n); setJoined(true) } }} disabled={!nick.trim()} className="bg-[#3B82F6] text-white py-3 rounded-lg font-semibold disabled:opacity-50">进入聊天室</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-[#0A0F14] h-full relative overflow-hidden">
      <TopBar active="chat" onHome={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="overflow-y-auto px-4 py-3 space-y-2" style={{ height: 'calc(100% - 100px)', paddingBottom: 56 }}>
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.user === nick ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[75%] flex flex-col">
              {m.user !== nick && <span className="text-[10px] text-[#8D949E] mb-0.5 ml-1">{m.user}</span>}
              <div className={`px-3 py-2 rounded-xl text-sm ${m.user === nick ? 'bg-[#3B82F6] text-white rounded-br-sm' : 'bg-[#1A2129] text-[#E5E7EB] rounded-bl-sm'}`}>{m.text}</div>
              <span className="text-[9px] text-[#4D545C] mt-0.5 mx-1">{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-[#0A0F14] border-t border-[#242B33] px-3 py-2 flex gap-1.5">
        <button onClick={() => { const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)(); r.lang = 'zh-CN'; r.onresult = e => setInput(p => p + e.results[0][0].transcript); r.start() }} className="w-10 h-10 rounded-lg bg-[#1A2129] flex items-center justify-center flex-shrink-0 text-[#8D949E]"><Mic size={18} /></button>
        <input className="flex-1 bg-[#1A2129] rounded-lg px-3 py-2.5 text-sm text-[#F0F2F5] outline-none" placeholder="说点什么..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={!input.trim()} className="px-3 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium disabled:opacity-50 flex-shrink-0 flex items-center justify-center"><Send size={16} /></button>
      </div>
    </div>
  )
}
