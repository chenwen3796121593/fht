import { useState, useRef, useEffect } from 'react'
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
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-72">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[var(--gold-soft)] border border-[var(--gold-border)]">
              <MessageCircle size={26} className="text-[var(--gold)]" />
            </div>
            <div className="text-sm text-[var(--text-2)] mt-3">
              {connected ? <><span className="inline-block w-2 h-2 rounded-full bg-[var(--down)] mr-1.5 align-middle" />已连接</> : '连接中...'}
            </div>
          </div>
          <input className="field text-center" placeholder="输入昵称" value={nick} onChange={e => setNick(e.target.value)} onKeyDown={e => e.key === 'Enter' && onJoin()} />
          <button onClick={onJoin} disabled={!nick.trim()} className="btn-gold disabled:opacity-50">进入聊天室</button>
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
    localStorage.setItem('fh_mention_badge', '0')
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
          if (m.mentioned_user === nick && m.username !== nick) {
            try { const n = parseInt(localStorage.getItem('fh_mention_badge') || '0'); localStorage.setItem('fh_mention_badge', String(n + 1)) } catch {}
          }
          setMsgs(prev => {
            if (prev.find(p => p.id === m.id)) return prev
            const cleaned = prev.filter(p => !(String(p.id).startsWith('tmp_') && p.user === m.username))
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

  const join = () => { if (!nick.trim()) return; localStorage.setItem('fh_nick', nick.trim()); setJoined(true) }

  if (!joined) return <JoinScreen nick={nick} setNick={setNick} connected={connected} onJoin={join} />

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2.5 mx-auto max-w-[1080px] w-full">
        {msgs.map((m) => {
          const isMentioned = m.mentioned_user === nick
          return (
            <div key={m.id} className={`flex ${m.user === nick ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[78%] flex flex-col">
                {m.user !== nick && <span className="text-[10px] text-[var(--text-2)] mb-0.5 ml-1">{m.user}</span>}
                {m.voice_url ? (
                  <audio src={m.voice_url} controls className={`h-9 w-[200px] ${isMentioned ? 'ring-1 ring-[var(--gold)] rounded' : ''}`} preload="metadata" />
                ) : m.isVideoLink || (m.text || '').startsWith('📹') ? (
                  <div className="px-3 py-2.5 rounded-2xl text-sm bg-[var(--surface-2)] text-[var(--text)] rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <span>{(m.text || '').replace('📹 ', '')}</span>
                      <button onClick={() => joinVideoRoom((m.videoRoomId || (m.text || '').split('#').pop()))} className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--down)] text-white font-semibold hover:opacity-80 transition-opacity">加入</button>
                    </div>
                  </div>
                ) : (
                  <div className={`px-3 py-2.5 rounded-2xl text-sm ${m.user === nick ? 'bg-[var(--gold)] text-[var(--on-gold)] rounded-br-md' : isMentioned ? 'bg-[var(--surface-2)] text-[var(--text)] rounded-bl-md border-l-2 border-[var(--gold)]' : 'bg-[var(--surface-2)] text-[var(--text)] rounded-bl-md'}`}>{m.text}</div>
                )}
                <span className="text-[9px] text-[var(--text-3)] mt-0.5 mx-1">{m.time}</span>
              </div>
            </div>
          )
        })}
        <div ref={msgEndRef} />
      </div>
      {videoRoom && <VideoRoom roomId={videoRoom} nick={nick} onClose={() => setVideoRoom(null)} />}
      <div className="bg-[var(--bg-elev)]/95 backdrop-blur-xl border-t border-[var(--border-soft)] px-2 pt-2 pb-3 flex gap-1 relative mx-auto max-w-[1080px] w-full">
        <button onClick={toggleRecord} className={`h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${recording ? 'bg-[var(--up)] text-white w-[64px] gap-1' : 'bg-[var(--surface-2)] text-[var(--text-2)] w-9 hover:text-[var(--text)]'}`}>
          {recording ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /><span className="text-[9px]">停止</span></> : <Mic size={15} />}
        </button>
        <button onClick={startVideo}
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"><Video size={15} /></button>
        <input ref={inputRef} className="field flex-1 min-w-0 h-9 py-0" placeholder="输入文字..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { send(); setShowEmoji(false); setShowAtList(false) } }} onFocus={() => { setShowEmoji(false); setShowAtList(false) }} />
        <button onClick={() => { send(); setShowEmoji(false); setShowAtList(false) }} disabled={!input.trim()} className="btn-gold h-9 px-3 disabled:opacity-50 flex-shrink-0"><Send size={15} /></button>
        <button onClick={() => setShowEmoji(!showEmoji)} className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${showEmoji ? 'bg-[var(--gold)] text-[var(--on-gold)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'}`}><Smile size={15} /></button>
        <button onClick={() => { setShowAtList(!showAtList); setShowEmoji(false) }}
          className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${showAtList ? 'bg-[var(--gold)] text-[var(--on-gold)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'}`}><AtSign size={15} /></button>

        {showEmoji && (
          <div className="absolute bottom-12 left-2 panel p-2.5 shadow-2xl z-20">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((em, i) => { const Icon = em.icon; return <button key={i} onClick={() => { setInput(prev => prev + em.label); setShowEmoji(false) }} className="w-8 h-8 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg transition-colors" title={em.label}><Icon size={16} /></button> })}
            </div>
          </div>
        )}

        {showAtList && (() => {
          const allUsers = [...new Set([...onlineUsers, ...recentUsers])].filter(u => u !== nick)
          return (
            <div className="absolute bottom-12 left-2 panel p-2 shadow-2xl z-20 min-w-[130px] max-h-[220px] overflow-y-auto scrollbar-hide">
              <div className="text-[10px] text-[var(--text-3)] mb-1.5 px-1">选择提醒对象</div>
              {allUsers.length === 0 && <div className="text-xs text-[var(--text-3)] px-1 py-2">暂无用户</div>}
              {allUsers.map(u => {
                const isOnline = onlineUsers.includes(u)
                return (
                  <div key={u} className="flex items-center hover:bg-[var(--surface-2)] rounded transition-colors">
                    <button onClick={() => insertAt(u)}
                      className="flex-1 text-left px-2 py-1.5 rounded text-xs text-[var(--text)] flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[var(--down)]' : 'bg-[var(--text-3)]'}`} />{u}
                    </button>
                    <button onClick={() => callAndOpen(u)}
                      className="px-2 py-1.5 text-[var(--down)] hover:bg-[var(--down-soft)] rounded"
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
