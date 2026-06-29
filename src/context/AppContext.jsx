import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import useMarketData from '../hooks/useMarketData.js'
import { BREADTH_INTERVAL, SUPABASE_URL, SUPABASE_KEY } from '../lib/constants.js'
import { createClient } from '@supabase/supabase-js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('home')
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  // Breadth — pre-fetch on app start
  const [breadth, setBreadth] = useState(() => {
    try {
      const raw = localStorage.getItem('fh_breadth')
      if (raw) { const p = JSON.parse(raw); if (Date.now() - p.ts < 300000) return p.data }
    } catch {}
    return null
  })

  useEffect(() => {
    let cancelled = false
    const fetchBreadth = async () => {
      try {
        const res = await fetch('/api/breadth?t=' + Date.now())
        const data = await res.json()
        if (!cancelled && data.total > 0) {
          setBreadth(data)
          localStorage.setItem('fh_breadth', JSON.stringify({ data, ts: Date.now() }))
        }
      } catch(e) {}
    }
    fetchBreadth()
    const t = setInterval(fetchBreadth, BREADTH_INTERVAL)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    timersRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timersRef.current[id]
    }, 3000)
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  // Watchlist
  const [extraSymbols, setExtraSymbols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fh_custom') || '[]')
      return (Array.isArray(saved) ? saved : [])
        .filter(s => s?.symbol)
        .map(s => ({ symbol: s.symbol, name: s.name || s.symbol }))
    } catch { return [] }
  })

  const { prices, quotes, marketCards, loading } = useMarketData(extraSymbols)

  const [incomingCall, setIncomingCall] = useState(null)
  const callChannelRef = useRef(null)

  // Init shared call channel
  useEffect(() => {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    const ch = sb.channel('fh-calls', { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'call' }, ({ payload }) => {
      setIncomingCall({ from: payload.from, roomId: payload.roomId })
    })
    ch.on('broadcast', { event: 'call_cancel' }, () => {
      setIncomingCall(null)
    })
    ch.subscribe()
    callChannelRef.current = ch
    return () => { try { sb.removeChannel(ch) } catch {} }
  }, [])

  const callUser = useCallback((to, from, roomId) => {
    callChannelRef.current?.send({ type: 'broadcast', event: 'call', payload: { to, from, roomId } })
  }, [])

  const dismissIncoming = useCallback(() => setIncomingCall(null), [])

  // Global online presence — tracked regardless of which page user is on
  useEffect(() => {
    const nick = (() => { try { return localStorage.getItem('fh_nick') || '' } catch { return '' } })()
    if (!nick) return
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    const ch = sb.channel('online-users', { config: { presence: { key: nick } } })
    ch.subscribe((status) => { if (status === 'SUBSCRIBED') ch.track({ user: nick }) })
    return () => { try { sb.removeChannel(ch).catch(()=>{}) } catch {} }
  }, [])

  const navigate = useCallback((page) => setCurrentPage(page), [])
  const addExtraSymbol = useCallback((item) => {
    setExtraSymbols(prev => prev.some(s => s.symbol === item.symbol) ? prev : [...prev, item])
  }, [])

  return (
    <AppContext.Provider value={{ currentPage, navigate, prices, quotes, marketCards, loading, addExtraSymbol, showToast, breadth, incomingCall, callUser, dismissIncoming }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-1.5 pointer-events-none">
          {toasts.map(item => {
            const bg = item.type === 'error' ? 'bg-[#EF4444]' : item.type === 'success' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'
            return <div key={item.id} className={`${bg} text-white text-xs px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto`}>{item.message}</div>
          })}
        </div>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
