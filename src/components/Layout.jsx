import TopBar from './TopBar'
import { useApp } from '../context/AppContext.jsx'

// 响应式布局：手机顶栏 + 平板/电脑侧边栏
export default function Layout({ children }) {
  const { currentPage } = useApp()

  return (
    <div className="bg-[#0A0F14] min-h-dvh w-full flex">
      {/* 桌面侧边栏 */}
      <div className="hidden lg:flex w-20 lg:w-24 flex-shrink-0">
        <TopBar active={currentPage} sidebar />
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
