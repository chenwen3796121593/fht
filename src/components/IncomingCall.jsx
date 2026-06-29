import { useEffect, useRef } from 'react'
import { Phone, PhoneOff } from 'lucide-react'

export default function IncomingCall({ from, onAccept, onDecline }) {
  const audioCtx = useRef(null)
  const vibrateTimer = useRef(null)

  useEffect(() => {
    // Melodic ringtone pattern
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtx.current = ctx
      const playTone = (freq, dur, delay) => {
        if (!audioCtx.current) return
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = freq
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur)
      }
      const playRing = (offset) => {
        // Two-note chime: C5 → E5, like "ding-dong"
        playTone(523, 0.3, offset)      // C5
        playTone(659, 0.3, offset + 0.3) // E5
      }
      // Pattern: ring(0s) → pause(1.6s) → ring(2.5s) → pause(1.6s) → repeat
      const loop = setInterval(() => {
        playRing(0); playRing(1.0)
      }, 3500)
      playRing(0); playRing(1.0)
      vibrateTimer.current = setInterval(() => { try { navigator.vibrate?.([300,200,300]) } catch {} }, 3500)
      try { navigator.vibrate?.([300,200,300]) } catch {}

      return () => { clearInterval(loop); clearInterval(vibrateTimer.current); try { ctx.close() } catch {} }
    } catch { return () => {} }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0A0F14] gap-6">
      <div className="text-[#8D949E] text-sm">视频通话邀请</div>
      <div className="text-[#F0F2F5] text-2xl font-bold">{from}</div>
      <div className="text-[#4D545C] text-xs animate-pulse">邀请你进行视频通话...</div>
      <div className="flex gap-6 mt-4">
        <button onClick={onDecline}
          className="w-14 h-14 rounded-full bg-[#EF4444] flex items-center justify-center hover:bg-[#DC2626] transition-colors active:scale-95">
          <PhoneOff size={24} className="text-white" />
        </button>
        <button onClick={onAccept}
          className="w-14 h-14 rounded-full bg-[#22C55E] flex items-center justify-center hover:bg-[#16A34A] transition-colors active:scale-95">
          <Phone size={24} className="text-white" />
        </button>
      </div>
      <div className="text-[10px] text-[#4D545C] mt-2">拒绝 · 接听</div>
    </div>
  )
}
