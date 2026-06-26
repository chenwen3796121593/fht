import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const timersRef = useRef({})

  const show = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, message, type }])
    timersRef.current[id] = setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
      delete timersRef.current[id]
    }, 3000)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-1.5 pointer-events-none">
          {items.map(item => {
            const bg = item.type === 'error' ? 'bg-[#EF4444]' : item.type === 'success' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'
            return (
              <div key={item.id} className={`${bg} text-white text-xs px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto animate-[fadeIn_0.2s_ease-out]`}>
                {item.message}
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// Keep a global shortcut for non-context usage (imports in hooks)
let globalShow = null
export function showToast(message, type = 'info') {
  if (globalShow) globalShow(message, type)
}

// Internal: called from ToastProvider to register the global shortcut
export function ToastBridge() {
  const { show } = useToast()
  useEffect(() => {
    globalShow = show
    return () => { globalShow = null }
  }, [show])
  return null
}
