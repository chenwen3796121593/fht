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
function fmtTime(d) { return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }

export default function ChatPage({ onNavigate }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [nick, setNick] = useState(() => localStorage.getItem('fh_nick') || '')
  const [joined, setJoined] = useState(!!localStorage.getItem('fh_nick'))
  const [connected, setConnected] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [recording, setRecording] = useState(false)
  const initRef = useRef(false)
  const msgEndRef = useRef(null)
  const mediaRef = useRef(null)
  const recRef = useRef(null)

  useEffect(() => {
    if (initRef.current) return; initRef.current = true
    let sb = null
    getSB().then(async (client) => {
      sb = client
      setConnected(true)
      try {
        const dayAgo = new Date(Date.now() - 86400000).toISOString()
        const { data } = await sb.from('messages').select('*').gte('created_at', dayAgo).order('created_at', { ascending: false }).limit(50)
        if (data) { setMsgs(data.reverse().map(m => ({ id: m.id, user: m.username, text: m.text, voice_url: m.voice_url, time: fmtTime(m.created_at) }))) }
      } catch(e) {}
      setHistoryLoaded(true)
      sb.channel('chat-room').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new; setMsgs(prev => { if (prev.find(p => p.id === m.id)) return prev; return [...prev, { id: m.id, user: m.username, text: m.text, voice_url: m.voice_url, time: fmtTime(m.created_at) }] })
      }).subscribe()
    })
    return () => { if (sb) { sb.removeAllChannels(); sb = null } }
  }, [])

  useEffect(() => { if (historyLoaded) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, historyLoaded])

  // Text send
  const send = async () => {
    const t = input.trim(); if (!t || !supabase) return; setInput('')
    await supabase.from('messages').insert({ username: nick, text: t })
  }

  // Voice recording - tap to start, tap again to stop
  const [permGranted, setPermGranted] = useState(false)

  const toggleRecord = async () => {
    if (recording) {
      // Stop and send
      if (mediaRef.current && mediaRef.current.state === 'recording') {
        mediaRef.current.stop()
      }
      return
    }
    // Start recording
    setRecording(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermGranted(true)
      const chunks = []
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const filename = `voice/${Date.now()}.webm`
          const { error } = await supabase.storage.from('chat').upload(filename, blob)
          if (!error) {
            const { data: urlData } = supabase.storage.from('chat').getPublicUrl(filename)
            if (urlData?.publicUrl) { await supabase.from('messages').insert({ username: nick, text: '', voice_url: urlData.publicUrl }) }
          }
        }
        setRecording(false); mediaRef.current = null
      }
      mr.start(); mediaRef.current = mr
      setTimeout(() => { if (mediaRef.current && mediaRef.current.state === 'recording') mediaRef.current.stop() }, 30000)
    } catch(e) { setRecording(false) }
  }

  // Join screen
  if (!joined) return (
    <div className="bg-[#0A0F14] h-full flex flex-col">
      <TopBar active="chat" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-64">
          <div className="text-center"><MessageCircle size={40} className="text-[#3B82F6] mx-auto mb-3" /><div className="text-lg font-bold text-[#F0F2F5]">烽火台聊天室</div><div className="text-xs text-[#8D949E] mt-1">{connected ? <><span className="inline-block w-2 h-2 rounded-full bg-[#22C55E] mr-1" />已连接</> : '连接中...'}</div></div>
          <input className="bg-[#1A2129] rounded-lg px-4 py-3 text-sm text-[#F0F2F5] outline-none" placeholder="输入昵称" value={nick} onChange={e => setNick(e.target.value)} onKeyDown={e => e.key === 'Enter' && join()} />
          <button onClick={join} disabled={!nick.trim()} className="bg-[#3B82F6] text-white py-3 rounded-lg font-semibold disabled:opacity-50">进入聊天室</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-[#0A0F14] h-full overflow-hidden flex flex-col">
      <TopBar active="chat" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.user === nick ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[75%] flex flex-col">
              {m.user !== nick && <span className="text-[10px] text-[#8D949E] mb-0.5 ml-1">{m.user}</span>}
              {m.voice_url ? (
                <audio src={m.voice_url} controls className="h-8 w-[180px]" preload="metadata" />
              ) : (
                <div className={`px-3 py-2 rounded-xl text-sm ${m.user === nick ? 'bg-[#3B82F6] text-white rounded-br-sm' : 'bg-[#1A2129] text-[#E5E7EB] rounded-bl-sm'}`}>{m.text}</div>
              )}
              <span className="text-[9px] text-[#4D545C] mt-0.5 mx-1">{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={msgEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-[#0A0F14] border-t border-[#242B33] px-3 py-2 flex gap-1.5">
        <button
          onClick={toggleRecord}
          className={`h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${recording ? 'bg-[#EF4444] text-white w-[72px] gap-1' : 'bg-[#1A2129] text-[#8D949E] w-12'}`}
        >
          {recording ? <><span className="w-2 h-2 rounded-full bg-white animate-pulse" /><span className="text-xs">停止</span></> : <Mic size={18} />}
        </button>
        <input className="flex-1 bg-[#1A2129] rounded-lg px-3 py-2.5 text-sm text-[#F0F2F5] outline-none" placeholder="输入文字，或点左边麦克风发语音" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={!input.trim()} className="px-3 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium disabled:opacity-50 flex-shrink-0 flex items-center justify-center"><Send size={16} /></button>
      </div>
    </div>
  )
}
