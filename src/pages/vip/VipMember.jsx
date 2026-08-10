export default function VipMember({ currentUser, strategy, handleLogout }) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-6">
      <div className="w-full flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--gold-soft)] border border-[var(--gold-border)]">
          <span className="text-[var(--gold)] font-bold text-sm">{currentUser?.slice(0,1) || 'V'}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{currentUser}</div>
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
      <button onClick={handleLogout} className="btn-ghost w-[calc(100%-2rem)]">退出登录</button>
    </div>
  )
}
