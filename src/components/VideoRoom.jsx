import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Mic, MicOff, Video, VideoOff, Loader } from 'lucide-react'

const SIGNAL_URL = 'wss://fenghuotai-video.3796121593.workers.dev/room/'
const ICE_SERVERS = {
  iceServers: [
    { urls: ['stun:stun.qq.com:3478', 'stun:stun.miwifi.com:3478'] },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  ]
}

export default function VideoRoom({ roomId, nick, onClose }) {
  const [peers, setPeers] = useState([])
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [status, setStatus] = useState('connecting')
  const localVideo = useRef(null)
  const wsRef = useRef(null)
  const pcsRef = useRef({})
  const streamRef = useRef(null)
  const nickRef = useRef(nick)
  nickRef.current = nick

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...data, from: nickRef.current }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('connecting')

    // Connect WebSocket to PartyKit room
    const ws = new WebSocket(SIGNAL_URL + roomId)
    wsRef.current = ws

    ws.onopen = async () => {
      if (cancelled) return
      setStatus('media')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (localVideo.current) localVideo.current.srcObject = stream
        setStatus('connected')
        // Announce join
        send({ type: 'join' })
      } catch(e) {
        setStatus('error')
      }
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.from === nickRef.current) return
        handleSignal(data)
      } catch {}
    }

    ws.onclose = () => {
      if (!cancelled) setStatus('disconnected')
    }

    async function handleSignal(data) {
      const { from, type, sdp, candidate } = data

      if (type === 'join') {
        createOfferTo(from)
        return
      }
      if (type === 'leave') {
        if (pcsRef.current[from]) { pcsRef.current[from].close(); delete pcsRef.current[from] }
        setPeers(prev => prev.filter(p => p.user !== from))
        return
      }

      // Ensure we have a PC for this peer
      let pc = pcsRef.current[from]
      if (!pc) {
        pc = new RTCPeerConnection(ICE_SERVERS)
        pcsRef.current[from] = pc
        if (streamRef.current) streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
        pc.onicecandidate = (e) => { if (e.candidate) send({ to: from, type: 'ice', candidate: e.candidate }) }
        pc.ontrack = (e) => setPeers(prev => prev.map(p => p.user === from ? { ...p, stream: e.streams[0] } : p))
        pc.oniceconnectionstatechange = () => {
          if (['disconnected','failed','closed'].includes(pc.iceConnectionState)) {
            pc.close(); delete pcsRef.current[from]
            setPeers(prev => prev.filter(p => p.user !== from))
          }
        }
      }

      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        send({ to: from, type: 'answer', sdp: pc.localDescription })
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      } else if (type === 'ice' && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      }
    }

    async function createOfferTo(targetUser) {
      if (pcsRef.current[targetUser]) return
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcsRef.current[targetUser] = pc
      if (streamRef.current) streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
      pc.onicecandidate = (e) => { if (e.candidate) send({ to: targetUser, type: 'ice', candidate: e.candidate }) }
      pc.ontrack = (e) => setPeers(prev => prev.map(p => p.user === targetUser ? { ...p, stream: e.streams[0] } : p))
      pc.oniceconnectionstatechange = () => {
        if (['disconnected','failed','closed'].includes(pc.iceConnectionState)) {
          pc.close(); delete pcsRef.current[targetUser]
          setPeers(prev => prev.filter(p => p.user !== targetUser))
        }
      }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      send({ to: targetUser, type: 'offer', sdp: pc.localDescription })
    }

    return () => {
      cancelled = true
      send({ type: 'leave' })
      if (ws.readyState === WebSocket.OPEN) ws.close()
      Object.values(pcsRef.current).forEach(pc => { try { pc.close() } catch {} })
      if (streamRef.current) streamRef.current.getTracks().forEach(t => { try { t.stop() } catch {} })
    }
  }, [roomId, send])

  const toggleMute = () => {
    if (streamRef.current) { streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted }); setMuted(!muted) }
  }
  const toggleVideo = () => {
    if (streamRef.current) { streamRef.current.getVideoTracks().forEach(t => { t.enabled = videoOff }); setVideoOff(!videoOff) }
  }

  const total = peers.length + 1
  const cols = total <= 2 ? 1 : 2

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0F14] flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#12161C] border-b border-[#242B33]">
        <span className="text-sm font-bold text-[#F0F2F5] flex-1">
          视频通话{status === 'connected' ? ' · ' + total + '人' : ''}
          {status === 'connecting' ? ' · 连接中...' : status === 'media' ? ' · 获取摄像头...' : status === 'error' ? ' · 摄像头失败' : ''}
          {status === 'disconnected' ? ' · 已断开' : ''}
        </span>
        <button onClick={toggleMute} className={`w-8 h-8 rounded-lg flex items-center justify-center ${muted ? 'bg-[#EF4444] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{muted ? <MicOff size={16} /> : <Mic size={16} />}</button>
        <button onClick={toggleVideo} className={`w-8 h-8 rounded-lg flex items-center justify-center ${videoOff ? 'bg-[#EF4444] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>{videoOff ? <VideoOff size={16} /> : <Video size={16} />}</button>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#EF4444] text-white flex items-center justify-center"><X size={16} /></button>
      </div>
      {status === 'connecting' && <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-[#4D545C]" /></div>}
      {status !== 'connecting' && (
        <div className={`flex-1 grid gap-1 p-1 ${cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ gridAutoRows: '1fr' }}>
          <div className="relative bg-[#1A2129] rounded-lg overflow-hidden">
            {status === 'connected' ? <video ref={localVideo} autoPlay playsInline muted className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#4D545C] text-xs">摄像头未开启</div>}
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">{nick}（我）</span>
          </div>
          {peers.map(({ user }) => (
            <div key={user} className="relative bg-[#1A2129] rounded-lg overflow-hidden">
              <video autoPlay playsInline className="w-full h-full object-cover" ref={el => { const p = peers.find(x => x.user === user); if (p && el && el.srcObject !== p.stream) el.srcObject = p.stream }} />
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">{user}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
