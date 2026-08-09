import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function TabDropdown({ tabs, active, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeTab = tabs.find(t => t.key === active)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setOpen(!open)}
        className={`chip ${activeTab ? 'chip-soft' : ''} min-w-[100px] justify-between`}>
        <span>{activeTab?.label || active || '选择'}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 panel shadow-2xl z-20 min-w-[130px] overflow-hidden py-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { onChange(t.key); setOpen(false) }}
              className={`block w-full text-left px-3 py-2 text-xs transition-colors ${active === t.key ? 'bg-[var(--gold-soft)] text-[var(--gold-bright)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
