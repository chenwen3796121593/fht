import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/constants.js'
import IncomingCall from './IncomingCall.jsx'

const CHANNEL = 'fenghuotai-calls'

export default function CallProvider({ nick, onAnswer }) {
  const [incoming, setIncoming] = useState(null)
  const sbRef = useRef(null)
  const nickRef = useRef(nick)
  nickRef.current = nick

  useEffect(() => {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    sbRef.current = sb
    const ch = sb.channel(CHANNEL, { config: { broadcast: { self: false } } })

    ch.on('broadcast', { event: 'call' }, ({ payload }) => {
      if (payload.to === nickRef.current) {
        setIncoming({ from: payload.from, roomId: payload.roomId })
      }
    })

    ch.on('broadcast', { event: 'call_cancel' }, ({ payload }) => {
      if (payload.to === nickRef.current) {
        setIncoming(null)
      }
    })

    ch.subscribe()

    return () => {
      try { sb.removeChannel(ch).catch(() => {}) } catch {}
      try { sb.removeAllChannels() } catch {}
    }
  }, [])

  const accept = () => {
    if (incoming) onAnswer(incoming.roomId)
    setIncoming(null)
  }

  const decline = () => {
    if (incoming) {
      sbRef.current?.channel(CHANNEL)?.send({
        type: 'broadcast', event: 'call_cancel',
        payload: { from: nickRef.current, to: incoming.from }
      })
    }
    setIncoming(null)
  }

  return incoming ? (
    <IncomingCall from={incoming.from} onAccept={accept} onDecline={decline} />
  ) : null
}
