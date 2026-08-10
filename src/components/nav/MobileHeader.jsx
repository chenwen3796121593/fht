import { Flame } from 'lucide-react'
import { useClock } from './navConfig'

// 手机顶部品牌条：高度 = --topbar-h (48px)，md 起隐藏
// 位于滚动容器之外，所以页面内 sticky 元素一律 top:0 即可
export default function MobileHeader() {
  const clock = useClock()

  return (
    <header className="md:hidden shrink-0 h-[var(--topbar-h)] flex items-center gap-2.5 px-4 bg-[var(--bg-elev)] border-b border-[var(--border-soft)]">
      <div className="w-7 h-7 rounded-lg grid place-items-center bg-[var(--gold-soft)] border border-[var(--gold-border)] shrink-0">
        <Flame size={15} className="text-[var(--gold)]" />
      </div>
      <span className="text-[14px] font-bold text-[var(--gold)] tracking-wide">烽火台</span>
      <div className="flex-1" />
      <span className="num text-[12px] text-[var(--text-2)]">{clock}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--down)] animate-pulse shrink-0" />
    </header>
  )
}
