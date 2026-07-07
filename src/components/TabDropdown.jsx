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
        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 active:scale-95 transition-all min-w-[100px] ${activeTab ? 'bg-[#3B82F6] text-white' : 'bg-[#1A2129] text-[#8D949E]'}`}>
        {activeTab?.label || active || '选择'}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#1A2129] border border-[#242B33] rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { onChange(t.key); setOpen(false) }}
              className={`block w-full text-left px-3 py-2 text-xs transition-colors ${active === t.key ? 'bg-[#3B82F6] text-white' : 'text-[#8D949E] hover:bg-[#242B33] hover:text-[#F0F2F5]'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
