export default function VipMember({ currentUser, strategy, handleLogout }) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-6 px-4 md:px-6">
      <div className="w-full flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--gold-soft)] border border-[rgba(232,176,75,0.25)]">
          <span className="text-[var(--gold)] font-bold text-sm">{currentUser?.slice(0,1) || 'V'}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{currentUser}</div>
          <div className="text-[10px] text-[var(--gold)]">VIP 会员</div>
        </div>
      </div>
      {strategy && (
        <div className="w-full">
          <div className="panel p-4">
            <span className="section-title mb-2.5">今日策略</span>
            <div className="text-xs text-[var(--text-2)] leading-relaxed whitespace-pre-wrap min-h-[120px]">{strategy}</div>
          </div>
        </div>
      )}
      <div className="w-full">
        <div className="panel p-4">
          <span className="text-sm font-semibold text-[var(--text)] block mb-3">VIP 专属功能</span>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-2)]">
            <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[var(--gold)]" />AI 商品股票趋势预测</div>
            <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[var(--gold)]" />实时异动监控</div>
            <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[var(--gold)]" />机构持仓追踪</div>
            <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[var(--gold)]" />深度行业研报</div>
          </div>
        </div>
      </div>
      <button onClick={handleLogout} className="btn-ghost w-[calc(100%-2rem)]">退出登录</button>
    </div>
  )
}
