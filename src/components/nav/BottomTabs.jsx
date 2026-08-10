import { PAGES, ICONS, LABELS, hasMentionBadge } from './navConfig'

// 手机底部标签栏：高度 = --bottombar-h (56px) + iPhone 安全区，md 起隐藏
// 不用 position:fixed —— 它是 flex 兄弟节点，只有 .page-scroll 滚动
export default function BottomTabs({ active, onNavigate }) {
  const badge = hasMentionBadge()

  return (
    <nav
      className="md:hidden shrink-0 grid grid-cols-5 bg-[var(--bg-elev)] border-t border-[var(--border)]"
      style={{ paddingBottom: 'var(--safe-b)' }}
    >
      {PAGES.map((page) => {
        const Icon = ICONS[page]
        const isActive = active === page
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 h-[var(--bottombar-h)] transition-colors ${
              isActive ? 'text-[var(--gold)]' : 'text-[var(--text-3)]'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b bg-[var(--gold)]" />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
            <span className="text-[10px] font-medium leading-none">{LABELS[page]}</span>
            {page === 'chat' && badge && (
              <span className="absolute top-2 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-[var(--up)] border border-[var(--bg-elev)]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
