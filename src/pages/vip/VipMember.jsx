import TopBar from '../../components/TopBar'
import { Crown, Edit3, Shield } from 'lucide-react'

export default function VipMember({ currentUser, strategy, handleLogout }) {
  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" />
      <div className="px-4 pt-5 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0"><Crown size={24} className="text-[#3B82F6]"/></div>
          <div><div className="text-base font-bold text-[#F0F2F5] leading-tight">VIP 专区</div><div className="text-xs text-[#8D949E]">{currentUser}</div></div>
        </div>
        {strategy && (
          <div className="w-full bg-[#12161C] border border-[#3B82F6]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><Edit3 size={14} className="text-[#3B82F6]"/><span className="text-xs font-semibold text-[#3B82F6]">今日策略</span></div>
            <div className="text-xs text-[#D1D5DB] leading-relaxed whitespace-pre-wrap min-h-[140px]">{strategy}</div>
          </div>
        )}
        <div className="w-full bg-[#12161C] border border-[#242B33] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-[#3B82F6]"/><span className="text-sm font-semibold text-[#F0F2F5]">VIP 专属功能</span></div>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#8D949E]">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"/>AI 商品股票趋势预测</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"/>实时异动监控</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"/>机构持仓追踪</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"/>深度行业研报</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full py-2.5 rounded-lg bg-[#1A2129] text-[#8D949E] text-sm font-medium hover:bg-[#242B33]">退出登录</button>
      </div>
    </div>
  )
}
