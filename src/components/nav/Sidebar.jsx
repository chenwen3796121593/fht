import { Flame } from 'lucide-react'
import { PAGES, ICONS, LABELS, useClock, hasMentionBadge } from './navConfig'

// 侧边栏：平板(md) 72px 图标栏 / 桌面(xl) 216px 宽栏带文字
// 仅在 md 以上渲染，由 Layout 控制显隐
export default function Sidebar({ active, onNavigate }) {
  const clock = useClock()
  const badge = hasMentionBadge()

  return (
    <aside className="h-dvh flex flex-col bg-[var(--bg-elev)] border-r border-[var(--border)] py-4 px-2 xl:px-3">
      {/* 品牌区 */}
      <div className="flex flex-col xl:flex-row items-center gap-1 xl:gap-2.5 xl:px-2 mb-4">
        <div className="w-10 h-10 rounded-xl grid place-items-center bg-[var(--gold-soft)] border border-[var(--gold-border)] shrink-0">
          <Flame size={20} className="text-[var(--gold)]" />
        </div>
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[11px] xl:text-[15px] font-bold text-[var(--gold)] tracking-wide">烽火台</span>
          <span className="hidden xl:block text-[10px] text-[var(--text-3)] mt-1 tracking-[0.12em]">TRADEBOARD</span>
        </div>
      </div>

      <div className="divider mb-2" />

      {/* 主导航 */}
      <nav className="flex flex-col gap-1">
        {PAGES.map((page) => {
          const Icon = ICONS[page]
          const isActive = active === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex flex-col xl:flex-row items-center gap-1 xl:gap-2.5 rounded-xl py-2.5 xl:px-3 w-full transition-colors ${
                isActive
                  ? 'bg-[var(--gold-soft)] text-[var(--gold)] shadow-[inset_0_0_0_1px_var(--gold-border)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-[var(--gold)]" />
              )}
              <Icon size={19} className="shrink-0" />
              <span className="text-[10px] xl:text-[13px] font-medium">{LABELS[page]}</span>
              {page === 'chat' && badge && (
                <span className="absolute top-1.5 right-2 xl:static xl:ml-auto w-2 h-2 rounded-full bg-[var(--up)] shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* 底部状态区 */}
      <div className="pt-3 mt-2 border-t border-[var(--border-soft)] flex flex-col xl:flex-row items-center xl:justify-between gap-1.5 xl:px-2">
        <span className="num text-[10px] xl:text-[12px] text-[var(--text-2)]">{clock}</span>
        <span className="flex items-center gap-1.5 text-[10px] xl:text-[11px] text-[var(--text-3)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--down)] animate-pulse shrink-0" />
          <span className="hidden xl:inline">实时行情</span>
        </span>
      </div>
    </aside>
  )
}
