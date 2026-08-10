import Sidebar from './nav/Sidebar'
import MobileHeader from './nav/MobileHeader'
import BottomTabs from './nav/BottomTabs'
import { useApp } from '../context/AppContext.jsx'

// AppShell —— 全站唯一渲染导航的地方
//  <768   手机：48px 品牌条 + 单列内容 + 56px 底部 Tab（含安全区）
//  ≥768   平板：72px 图标侧栏
//  ≥1280  桌面：216px 宽侧栏（图标 + 文字 + 底部状态）
// 只有 .page-scroll 滚动，外壳不滚动 —— 因此底栏无需 position:fixed，
// 且页面内 sticky 子标签一律 top:0，不再需要 top-[57px] 这类魔法数。
export default function Layout({ children }) {
  const { currentPage, navigate } = useApp()

  return (
    <div className="flex h-dvh w-full bg-[var(--bg)] overflow-hidden">
      <div className="hidden md:block w-[var(--sidebar-w)] shrink-0">
        <Sidebar active={currentPage} onNavigate={navigate} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-dvh">
        <MobileHeader />
        {children}
        <BottomTabs active={currentPage} onNavigate={navigate} />
      </div>
    </div>
  )
}
