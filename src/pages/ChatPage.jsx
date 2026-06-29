import { useState, useRef, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { MessageCircle, Mic, Send, Smile, Laugh, Heart, ThumbsUp, ThumbsDown, Star, Flame, Rocket, Gem, BadgeCheck, TrendingUp, TrendingDown, DollarSign, PartyPopper, Angry, Frown, Annoyed, Crown, Target, Zap, Eye, Hand, Handshake, Clover, Coffee, Beer, Sun, Moon, CloudRain, Gift, Music, Clock, Lightbulb, Camera, MapPin, Car, Home, Pizza, ShoppingCart, Gamepad2, Tv, Bed, Sparkles, Bomb, Shield, Ban, Pin, Bookmark, AtSign, Video, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { getSB } from '../lib/supabase.js'
import VideoRoom from '../components/VideoRoom.jsx'

const EMOJIS = [
  { icon: Smile, label: '😊' },{ icon: Laugh, label: '😂' },{ icon: PartyPopper, label: '🎉' },{ icon: Heart, label: '❤️' },{ icon: ThumbsUp, label: '👍' },{ icon: ThumbsDown, label: '👎' },{ icon: Star, label: '⭐' },{ icon: Flame, label: '🔥' },
  { icon: Angry, label: '😡' },{ icon: Frown, label: '☹️' },{ icon: Annoyed, label: '😤' },{ icon: Crown, label: '👑' },{ icon: Target, label: '🎯' },{ icon: Zap, label: '⚡' },{ icon: Eye, label: '👀' },{ icon: Sparkles, label: '✨' },
  { icon: TrendingUp, label: '📈' },{ icon: TrendingDown, label: '📉' },{ icon: DollarSign, label: '💰' },{ icon: Rocket, label: '🚀' },{ icon: Gem, label: '💎' },{ icon: BadgeCheck, label: '✅' },{ icon: Bomb, label: '💣' },{ icon: Lightbulb, label: '💡' },
  { icon: Coffee, label: '☕' },{ icon: Beer, label: '🍺' },{ icon: Gift, label: '🎁' },{ icon: Music, label: '🎵' },{ icon: Camera, label: '📷' },{ icon: Home, label: '🏠' },{ icon: Car, label: '🚗' },{ icon: Pizza, label: '🍕' },
  { icon: Clock, label: '🕐' },{ icon: Sun, label: '☀️' },{ icon: Moon, label: '🌙' },{ icon: CloudRain, label: '🌧️' },{ icon: ShoppingCart, label: '🛒' },{ icon: Gamepad2, label: '🎮' },{ icon: Tv, label: '📺' },{ icon: Bed, label: '🛏️' },
  { icon: Hand, label: '✋' },{ icon: Handshake, label: '🤝' },{ icon: MapPin, label: '📍' },{ icon: Pin, label: '📌' },{ icon: Bookmark, label: '🔖' },{ icon: Shield, label: '🛡️' },{ icon: Ban, label: '🚫' },{ icon: Clover, label: '🍀' },
]

function fmtTime(d) {
  const dt = new Date(d)
  const now = new Date()
  const time = dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (dt.toDateString() === now.toDateString()) return time
  return dt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + time
}

function extractMention(text) {
  const match = text.match(/@(\S+)/)
  return match ? match[1] : null
}

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
  const [onlineUsers, setOnlineUsers] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [showAtList, setShowAtList] = useState(false)
  const [videoRoom, setVideoRoom] = useState(null)
  const inputRef = useRef(null)
  const msgEndRef = useRef(null)
  const mediaRef = useRef(null)
  const sbRef = useRef(null)

  useEffect(() => {
    // Clear mention badge on enter
    localStorage.setItem('fh_mention_badge', '0')

    // Instant cache
    // Auto-clear cache from previous days
    if (localStorage.getItem('fh_cache_ver') !== '3') {
      localStorage.removeItem('fh_chat_cache')
      localStorage.setItem('fh_cache_ver', '3')
    }
    const cached = localStorage.getItem('fh_chat_cache')
    if (cached) { try { const parsed = JSON.parse(cached); if (parsed.length > 0) setMsgs(parsed) } catch {} }

    let cancelled = false
    ;(async () => {
      const sb = await getSB()
      if (cancelled) return
      sbRef.current = sb
      setConnected(true)

      // ---- Presence tracking ----
      const presenceChannel = sb.channel('online-users', {
        config: { presence: { key: nick } }
      })
      presenceChannel.on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = [...new Set(Object.values(state).flatMap(arr => arr.map(p => p.user || p.nick)).filter(Boolean))]
        setOnlineUsers(users)
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user: nick, online_at: new Date().toISOString() })
        }
      })

      // Fetch recent 24h active users for @mention list
      try {
        const dayAgo = new Date(Date.now() - 86400000).toISOString()
        const { data: recentData } = await sb.from('messages').select('username').gte('created_at', dayAgo).order('created_at', { ascending: false }).limit(100)
        if (recentData) setRecentUsers([...new Set(recentData.map(r => r.username))])
      } catch(e) {}

      try {
        const dayAgo = new Date(Date.now() - 86400000).toISOString()
        const { data } = await sb.from('messages').select('*').gte('created_at', dayAgo).order('created_at', { ascending: false }).limit(50)
        if (!cancelled && data?.length) {
          const mapped = data.reverse().map(m => ({ id: m.id, user: m.username, text: m.text, voice_url: m.voice_url, mentioned_user: m.mentioned_user, time: fmtTime(m.created_at) }))
          setMsgs(mapped)
          localStorage.setItem('fh_chat_cache', JSON.stringify(mapped.slice(-30)))
        }
      } catch(e) {}
      if (!cancelled) setHistoryLoaded(true)

      try {
        sb.channel('chat-room').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new

          // Badge if mentioned (not self-send)
          if (m.mentioned_user === nick && m.username !== nick) {
            try { const n = parseInt(localStorage.getItem('fh_mention_badge') || '0'); localStorage.setItem('fh_mention_badge', String(n + 1)) } catch {}
          }

          setMsgs(prev => {
            if (prev.find(p => p.id === m.id)) return prev
            const cleaned = prev.filter(p => !(String(p.id).startsWith('tmp_') && p.user === m.username))
            // Detect video room invite from text (starts with 📹)
            const txt = m.text || ''
            const msg = { id: m.id, user: m.username, text: txt, voice_url: m.voice_url, mentioned_user: m.mentioned_user, time: fmtTime(m.created_at) }
            if (txt.startsWith('📹')) {
              msg.isVideoLink = true
              msg.videoRoomId = txt.split('#').pop()?.trim() || ''
            }
            const next = [...cleaned, msg]
            localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30)))
            return next
          })
        }).subscribe()
      } catch(e) {}
    })()

    return () => { cancelled = true; try { if (sbRef.current) sbRef.current.removeAllChannels() } catch {} }
  }, [])

  useEffect(() => { if (historyLoaded) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, historyLoaded])

  const send = async () => {
    const t = input.trim(); if (!t) return; setInput('')
    const mentioned = extractMention(t)
    const tempId = 'tmp_' + Date.now()
    setMsgs(prev => { const next = [...prev, { id: tempId, user: nick, text: t, mentioned_user: mentioned, time: fmtTime(new Date()) }]; localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30))); return next })
    try {
      const client = await getSB()
      let { error } = await client.from('messages').insert({ username: nick, text: t, ...(mentioned ? { mentioned_user: mentioned } : {}) })
      if (error && mentioned) {
        // Retry without mentioned_user if column doesn't exist
        const retry = await client.from('messages').insert({ username: nick, text: t })
        error = retry.error
      }
      if (error) setMsgs(prev => prev.filter(m => m.id !== tempId))
    } catch(e) { setMsgs(prev => prev.filter(m => m.id !== tempId)) }
  }

  const insertAt = (user) => {
    setInput(prev => prev + '@' + user + ' ')
    setShowAtList(false)
    inputRef.current?.focus()
  }

  const startVideo = async () => {
    const roomId = Math.random().toString(36).slice(2, 8)
    setVideoRoom(roomId)
    // Insert to Supabase — subscription will deliver to everyone (including self)
    try {
      const client = await getSB()
      await client.from('messages').insert({ username: nick, text: '📹 视频通话 #' + roomId })
    } catch(e) {}
  }
  const { callUser } = useApp()
  const joinVideoRoom = (roomId) => { setVideoRoom(roomId) }

  const callAndOpen = (targetUser) => {
    const roomId = Math.random().toString(36).slice(2, 8)
    callUser(targetUser, nick, roomId)
    setVideoRoom(roomId)
    setShowAtList(false)
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
        setMsgs(prev => { const next = [...prev, { id: tempId, user: nick, text: '🎤 语音消息发送中...', voice_url: '', time: fmtTime(new Date()) }]; localStorage.setItem('fh_chat_cache', JSON.stringify(next.slice(-30))); return next })
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const filename = `voice/${Date.now()}.${ext}`
        const { error } = await client.storage.from('chat').upload(filename, blob)
        if (!error) {
          const { data: urlData } = client.storage.from('chat').getPublicUrl(filename)
          if (urlData?.publicUrl) await client.from('messages').insert({ username: nick, text: '', voice_url: urlData.publicUrl })
        } else { setMsgs(prev => prev.filter(m => m.id !== tempId)) }
        setRecording(false); mediaRef.current = null
      }
      mr.start(); mediaRef.current = mr
      setTimeout(() => { if (mediaRef.current?.state === 'recording') mediaRef.current.stop() }, 30000)
    } catch(e) { setRecording(false) }
  }

  const join = () => { if (!nick.trim()) return; localStorage.setItem('fh_nick', nick.trim()); setJoined(true); registerPush() }

  const registerPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE_CHlcSmmVQJAeMKDr7aXgcDR04ZoToAnMqx0x9KrMXzogihudvmOUlPZh88jI3vhC3j383qbRFc7jvmtNqC5IA',
      })
      const subscription = JSON.stringify(sub.toJSON())
      // Store in Supabase
      const client = await getSB()
      await client.from('push_tokens').upsert({ username: nick, subscription, updated_at: new Date().toISOString() }, { onConflict: 'username' })
    } catch(e) {}
  }

  if (!joined) return <JoinScreen nick={nick} setNick={setNick} connected={connected} onJoin={join} />

  return (
    <div className="bg-[#0A0F14] h-full overflow-hidden flex flex-col">
      <TopBar active="chat" />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {msgs.map((m) => {
          const isMentioned = m.mentioned_user === nick
          return (
            <div key={m.id} className={`flex ${m.user === nick ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%] flex flex-col">
                {m.user !== nick && <span className="text-[10px] text-[#8D949E] mb-0.5 ml-1">{m.user}</span>}
                {m.voice_url ? (
                  <audio src={m.voice_url} controls className={`h-8 w-[180px] ${isMentioned ? 'ring-1 ring-[#3B82F6] rounded' : ''}`} preload="metadata" />
                ) : m.isVideoLink || (m.text || '').startsWith('📹') ? (
                  <div className={`px-3 py-2 rounded-xl text-sm bg-[#1A2129] text-[#E5E7EB] rounded-bl-sm`}>
                    <div className="flex items-center gap-2">
                      <span>{(m.text || '').replace('📹 ', '')}</span>
                      <button onClick={() => joinVideoRoom((m.videoRoomId || (m.text || '').split('#').pop()))} className="text-[10px] px-2 py-0.5 rounded bg-[#22C55E] text-white font-medium hover:opacity-80 transition-opacity">加入</button>
                    </div>
                  </div>
                ) : (
                  <div className={`px-3 py-2 rounded-xl text-sm ${m.user === nick ? 'bg-[#3B82F6] text-white rounded-br-sm' : isMentioned ? 'bg-[#1A2129] text-[#E5E7EB] rounded-bl-sm border-l-2 border-[#3B82F6]' : 'bg-[#1A2129] text-[#E5E7EB] rounded-bl-sm'}`}>{m.text}</div>
                )}
                <span className="text-[9px] text-[#4D545C] mt-0.5 mx-1">{m.time}</span>
              </div>
            </div>
          )
        })}
        <div ref={msgEndRef} />
      </div>
      {videoRoom && <VideoRoom roomId={videoRoom} nick={nick} onClose={() => setVideoRoom(null)} />}
      <div className="bg-[#0A0F14] border-t border-[#242B33] px-2 pt-1.5 pb-3 flex gap-0.5 relative">
        <button onClick={toggleRecord} className={`h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${recording ? 'bg-[#EF4444] text-white w-[60px] gap-0.5' : 'bg-[#1A2129] text-[#8D949E] w-8'}`}>
          {recording ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /><span className="text-[9px]">停止</span></> : <Mic size={14} />}
        </button>
        <button onClick={startVideo}
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1A2129] text-[#8D949E] hover:text-[#F0F2F5] transition-colors"><Video size={14} /></button>
        <input ref={inputRef} className="flex-1 min-w-0 bg-[#1A2129] rounded-lg px-2 py-2 text-xs text-[#F0F2F5] outline-none" placeholder="输入文字..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { send(); setShowEmoji(false); setShowAtList(false) } }} onFocus={() => { setShowEmoji(false); setShowAtList(false) }} />
        <button onClick={() => { send(); setShowEmoji(false); setShowAtList(false) }} disabled={!input.trim()} className="h-8 px-2 bg-[#3B82F6] text-white rounded-lg text-xs font-medium disabled:opacity-50 flex-shrink-0 flex items-center justify-center"><Send size={14} /></button>
        <button onClick={() => setShowEmoji(!showEmoji)} className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${showEmoji ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}><Smile size={14} /></button>
        <button onClick={() => { setShowAtList(!showAtList); setShowEmoji(false) }}
          className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${showAtList ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}><AtSign size={14} /></button>

        {/* Emoji panel */}
        {showEmoji && (
          <div className="absolute bottom-11 left-12 bg-[#1A2129] border border-[#242B33] rounded-xl p-2.5 shadow-2xl z-20">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((em, i) => { const Icon = em.icon; return <button key={i} onClick={() => { setInput(prev => prev + em.label); setShowEmoji(false) }} className="w-8 h-8 flex items-center justify-center text-[#8D949E] hover:text-[#F0F2F5] hover:bg-[#242B33] rounded-lg transition-colors" title={em.label}><Icon size={16} /></button> })}
            </div>
          </div>
        )}

        {/* @mention user list */}
        {showAtList && (() => {
          const allUsers = [...new Set([...onlineUsers, ...recentUsers])].filter(u => u !== nick)
          return (
            <div className="absolute bottom-11 left-[80px] bg-[#1A2129] border border-[#242B33] rounded-xl p-2 shadow-2xl z-20 min-w-[120px] max-h-[200px] overflow-y-auto">
              <div className="text-[10px] text-[#4D545C] mb-1.5 px-1">选择提醒对象</div>
              {allUsers.length === 0 && <div className="text-xs text-[#4D545C] px-1 py-2">暂无用户</div>}
              {allUsers.map(u => {
                const isOnline = onlineUsers.includes(u)
                return (
                  <div key={u} className="flex items-center hover:bg-[#242B33] rounded transition-colors">
                    <button onClick={() => insertAt(u)}
                      className="flex-1 text-left px-2 py-1.5 rounded text-xs text-[#F0F2F5] flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#4D545C]'}`} />{u}
                    </button>
                    <button onClick={() => callAndOpen(u)}
                      className="px-2 py-1.5 text-[#22C55E] hover:bg-[#3B82F6]/20 rounded"
                      title="视频通话"><Phone size={13} /></button>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
