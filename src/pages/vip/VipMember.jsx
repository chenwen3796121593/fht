import TopBar from '../../components/TopBar'

export default function VipMember({ currentUser, strategy, handleLogout }) {
  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" />
      <div className="px-4 pt-5 flex flex-col items-center gap-4">
        <div>
          <div className="text-base font-bold text-[#F0F2F5] leading-tight text-center">VIP 专区</div>
          <div className="text-xs text-[#D1D5DB] text-center">{currentUser}</div>
        </div>
        {strategy && (
          <div className="w-full bg-[#12161C] border border-[#242B33] rounded-xl p-4">
            <span className="text-xs font-semibold text-[#F0F2F5] block mb-3">今日策略</span>
            <div className="text-xs text-[#D1D5DB] leading-relaxed whitespace-pre-wrap min-h-[140px]">{strategy}</div>
          </div>
        )}
        <div className="w-full bg-[#12161C] border border-[#242B33] rounded-xl p-4">
          <span className="text-sm font-semibold text-[#F0F2F5] block mb-3">VIP 专属功能</span>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#D1D5DB]">
            <div>AI 商品股票趋势预测</div>
            <div>实时异动监控</div>
            <div>机构持仓追踪</div>
            <div>深度行业研报</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full py-2.5 rounded-lg bg-[#1A2129] text-[#D1D5DB] text-sm font-medium hover:bg-[#242B33]">退出登录</button>
      </div>
    </div>
  )
}
