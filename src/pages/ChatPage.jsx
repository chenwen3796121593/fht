import { useState, useRef, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { MessageCircle, Mic, Send, Smile, Laugh, Heart, ThumbsUp, ThumbsDown, Star, Flame, Rocket, Gem, BadgeCheck, TrendingUp, TrendingDown, DollarSign, PartyPopper, Angry, Frown, Annoyed, Crown, Target, Zap, Eye, Hand, Handshake, Clover, Coffee, Beer, Sun, Moon, CloudRain, Gift, Music, Clock, Lightbulb, Camera, MapPin, Car, Home, Pizza, ShoppingCart, Gamepad2, Tv, Bed, Sparkles, Bomb, Shield, Ban, Pin, Bookmark } from 'lucide-react'
import { getSB } from '../lib/supabase.js'

const EMOJIS = [
  { icon: Smile, label: '😊' },{ icon: Laugh, label: '😂' },{ icon: PartyPopper, label: '🎉' },{ icon: Heart, label: '❤️' },{ icon: ThumbsUp, label: '👍' },{ icon: ThumbsDown, label: '👎' },{ icon: Star, label: '⭐' },{ icon: Flame, label: '🔥' },
  { icon: Angry, label: '😡' },{ icon: Frown, label: '☹️' },{ icon: Annoyed, label: '😤' },{ icon: Crown, label: '👑' },{ icon: Target, label: '🎯' },{ icon: Zap, label: '⚡' },{ icon: Eye, label: '👀' },{ icon: Sparkles, label: '✨' },
  { icon: TrendingUp, label: '📈' },{ icon: TrendingDown, label: '📉' },{ icon: DollarSign, label: '💰' },{ icon: Rocket, label: '🚀' },{ icon: Gem, label: '💎' },{ icon: BadgeCheck, label: '✅' },{ icon: Bomb, label: '💣' },{ icon: Lightbulb, label: '💡' },
  { icon: Coffee, label: '☕' },{ icon: Beer, label: '🍺' },{ icon: Gift, label: '🎁' },{ icon: Music, label: '🎵' },{ icon: Camera, label: '📷' },{ icon: Home, label: '🏠' },{ icon: Car, label: '🚗' },{ icon: Pizza, label: '🍕' },
  { icon: Clock, label: '🕐' },{ icon: Sun, label: '☀️' },{ icon: Moon, label: '🌙' },{ icon: CloudRain, label: '🌧️' },{ icon: ShoppingCart, label: '🛒' },{ icon: Gamepad2, label: '🎮' },{ icon: Tv, label: '📺' },{ icon: Bed, label: '🛏️' },
  { icon: Hand, label: '✋' },{ icon: Handshake, label: '🤝' },{ icon: MapPin, label: '📍' },{ icon: Pin, label: '📌' },{ icon: Bookmark, label: '🔖' },{ icon: Shield, label: '🛡️' },{ icon: Ban, label: '🚫' },{ icon: Clover, label: '🍀' },
]

function fmtTime(d) { return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }

function JoinScreen({ nick, setNick, connected, onJoin }) {
  return (
    <div className="bg-[#0A0F14] h-full flex flex-col">
      <TopBar active="chat" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-64">
          <div className="text-center"><MessageCircle size={40} className="text-[#3B82F6] mx-auto mb-3" /><div className="text-lg font-bold text-[#F0F2F5]">烽火台聊天室</div><div className="text-xs text-[#8D949E] mt-1">{connected ? <><span className="inline-block w-2 h-2 rounded-full bg-[#22C55E] mr-1" />已连接</> : '连接中...'}</div></div>
          <input className="bg-[#1A2129] rounded-lg px-4 py-3 text-sm text-[#F0F2F5] outline-none" placeholder="输入昵称" value={nick} onChange={e => setNick(e.target.value)} onKeyDown={e => e.key === 'Enter' && onJoin()} />
          <button onClick={onJoin} disabled={!nick.trim()} className="bg-[#3B82F6] text-white py-3 rounded-lg font-semibold disabled:opacity-50">进入聊天室</button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [nick, setNick] = useState(() => localStorage.getItem('fh_nick') || '')
  const [joined, setJoined] = useState(!!localStorage.getItem('fh_nick'))
  const [connected, setConnected] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const msgEndRef = useRef(null)
  const mediaRef = useRef(null)
  const sbRef = useRef(null)

  useEffect(() => {
    // Instant cache
    const cached = localStorage.getItem('fh_chat_cache')
    if (cached) { try { const parsed = JSON.parse(cached); if (parsed.length > 0) setMsgs(parsed) } catch {} }

    let cancelled = false
    ;(async () => {
      const sb = await getSB()
      if (cancelled) return
      sbRef.current = sb
      setConnected(true)

      try {
        const dayAgo = new Date(Date.now() - 86400000).toISOString()
        const { data } = await sb.from('messages').select('*').gte('created_at', dayAgo).order('created_at', { ascending: false }).limit(50)
        if (!cancelled && data?.length) {
          const mapped = data.reverse().map(m => ({ id: m.id, user: m.username, text: m.text, voice_url: m.voice_url, time: fmtTime(m.created_at) }))
          setMsgs(mapped)
          localStorage.setItem('fh_chat_cache', JSON.stringify(mapped.slice(-30)))
        }
      } catch(e) {}
      if (!cancelled) setHistoryLoaded(true)

      try {
        sb.channel('chat-room').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new
          setMsgs(prev => {
            if (prev.find(p => p.id === m.id)) return prev
            const cleaned = prev.filter(p => !(String(p.id).startsWith('tmp_') && p.user === m.username && p.text === m.text))
            const next = [...cleaned, { id: m.id, user: m.username, text: m.text, voice_url: m.voice_url, time: fmtTime(m.created_at) }]
            localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30)))
            return next
          })
        }).subscribe()
      } catch(e) { console.error('Channel error:', e) }
    })()

    return () => { cancelled = true; try { if (sbRef.current) sbRef.current.removeAllChannels() } catch {} }
  }, [])

  useEffect(() => { if (historyLoaded) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, historyLoaded])

  const send = async () => {
    const t = input.trim(); if (!t) return; setInput('')
    const tempId = 'tmp_' + Date.now()
    setMsgs(prev => { const next = [...prev, { id: tempId, user: nick, text: t, time: fmtTime(new Date()) }]; localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30))); return next })
    try {
      const client = await getSB()
      const { error } = await client.from('messages').insert({ username: nick, text: t })
      if (error) setMsgs(prev => prev.filter(m => m.id !== tempId))
    } catch(e) { setMsgs(prev => prev.filter(m => m.id !== tempId)) }
  }

  const toggleRecord = async () => {
    if (recording) { if (mediaRef.current?.state === 'recording') mediaRef.current.stop(); return }
    setRecording(true)
    try {
      const client = await getSB()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/mp4'
      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (chunks.length === 0) { setRecording(false); return }
        const tempId = 'tmp_voice_' + Date.now()
        const blob = new Blob(chunks, { type: mimeType })
        const blobUrl = URL.createObjectURL(blob)
        setMsgs(prev => { const next = [...prev, { id: tempId, user: nick, text: '', voice_url: blobUrl, time: fmtTime(new Date()) }]; localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30))); return next })
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const { error } = await client.storage.from('chat').upload(`voice/${Date.now()}.${ext}`, blob)
        URL.revokeObjectURL(blobUrl)
        if (!error) {
          const { data: urlData } = client.storage.from('chat').getPublicUrl(`voice/${Date.now()}.${ext}`)
          if (urlData?.publicUrl) await client.from('messages').insert({ username: nick, text: '', voice_url: urlData.publicUrl })
        } else { setMsgs(prev => prev.filter(m => m.id !== tempId)) }
        setRecording(false); mediaRef.current = null
      }
      mr.start(); mediaRef.current = mr
      setTimeout(() => { if (mediaRef.current?.state === 'recording') mediaRef.current.stop() }, 30000)
    } catch(e) { setRecording(false) }
  }

  const join = () => { if (!nick.trim()) return; localStorage.setItem('fh_nick', nick.trim()); setJoined(true) }

  if (!joined) return <JoinScreen nick={nick} setNick={setNick} connected={connected} onJoin={join} />

  return (
    <div className="bg-[#0A0F14] h-full overflow-hidden flex flex-col">
      <TopBar active="chat" />
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
      <div className="bg-[#0A0F14] border-t border-[#242B33] px-3 py-2 flex gap-1.5 relative">
        <button onClick={toggleRecord} className={`h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${recording ? 'bg-[#EF4444] text-white w-[72px] gap-1' : 'bg-[#1A2129] text-[#8D949E] w-10'}`}>
          {recording ? <><span className="w-2 h-2 rounded-full bg-white animate-pulse" /><span className="text-xs">停止</span></> : <Mic size={16} />}
        </button>
        <button onClick={() => setShowEmoji(!showEmoji)} className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${showEmoji ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}><Smile size={16} /></button>
        <input className="flex-1 bg-[#1A2129] rounded-lg px-3 py-2.5 text-sm text-[#F0F2F5] outline-none" placeholder="输入文字..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { send(); setShowEmoji(false) } }} onFocus={() => setShowEmoji(false)} />
        <button onClick={() => { send(); setShowEmoji(false) }} disabled={!input.trim()} className="px-3 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium disabled:opacity-50 flex-shrink-0 flex items-center justify-center"><Send size={16} /></button>
        {showEmoji && (
          <div className="absolute bottom-12 left-12 bg-[#1A2129] border border-[#242B33] rounded-xl p-2.5 shadow-2xl z-20">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((em, i) => { const Icon = em.icon; return <button key={i} onClick={() => { setInput(prev => prev + em.label); setShowEmoji(false) }} className="w-8 h-8 flex items-center justify-center text-[#8D949E] hover:text-[#F0F2F5] hover:bg-[#242B33] rounded-lg transition-colors" title={em.label}><Icon size={16} /></button> })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
