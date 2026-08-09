import TopBar from './TopBar'
import { useApp } from '../context/AppContext.jsx'

// 响应式布局（三档）：手机顶栏 + iPad/电脑侧边栏
//  < 768px        手机：顶部导航栏 + 单列
//  ≥768px  (md)  iPad/平板：图标侧边栏 + 双栏内容
//  ≥1280px (xl)  电脑：更宽侧边栏 + 多栏 + 内容限宽居中
export default function Layout({ children }) {
  const { currentPage } = useApp()

  return (
    <div className="bg-[var(--bg)] min-h-dvh w-full flex">
      {/* 侧边栏（iPad / 电脑） */}
      <div className="hidden md:flex w-[var(--sidebar-w)] xl:w-[var(--sidebar-w-lg)] flex-shrink-0">
        <TopBar active={currentPage} sidebar />
      </div>

      {/* 内容区：限宽居中，避免大屏无限拉伸 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-dvh">
        <div className="shell flex-1 flex flex-col min-w-0 min-h-dvh">
          {children}
        </div>
      </div>
    </div>
  )
}
