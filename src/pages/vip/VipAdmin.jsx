import { useState } from 'react'
import { Check, X } from 'lucide-react'

export default function VipAdmin({
  strategyDraft, setStrategyDraft, savingStrat, handleSaveStrategy,
  applications, loadingApps, handleRefresh, handleApprove, handleReject, handleLogout,
}) {
  const [statusMsg, setStatusMsg] = useState('')

  const onSave = async () => {
    setStatusMsg('')
    try {
      await handleSaveStrategy()
      setStatusMsg('✅ 策略已发布')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch(e) {
      setStatusMsg('❌ 发布失败: ' + (e.message || '未知错误'))
    }
  }

  const onApprove = async (app) => {
    try {
      await handleApprove(app)
      setStatusMsg('✅ ' + app.phone + ' 已通过')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch(e) {
      setStatusMsg('❌ 操作失败: ' + (e.message || '未知错误'))
    }
  }

  const onReject = async (app) => {
    try {
      await handleReject(app)
      setStatusMsg('✅ ' + app.phone + ' 已拒绝')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch(e) {
      setStatusMsg('❌ 操作失败: ' + (e.message || '未知错误'))
    }
  }

  return (
    <div className="content-narrow mx-auto w-full">

      {/* Strategy editor */}
      <div className="pt-4 pb-3">
        <div className="panel p-4 flex flex-col gap-3 border-[var(--gold-border)]">
          <span className="section-title">今日策略</span>
          <textarea className="field resize-none h-32" placeholder="写下今日交易策略..." value={strategyDraft} onChange={e => setStrategyDraft(e.target.value)} />
          <button onClick={onSave} disabled={savingStrat || !strategyDraft.trim()} className="btn-gold disabled:opacity-40">{savingStrat ? '发布中...' : '发布策略'}</button>
          {statusMsg && <div className={`text-xs font-medium text-center ${statusMsg.startsWith('✅') ? 'text-[var(--down)]' : 'text-[var(--up)]'}`}>{statusMsg}</div>}
        </div>
      </div>

      {/* Application management */}
      <div className="pb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text)]">申请管理</span>
        <button onClick={handleLogout} className="text-xs text-[var(--text-3)] hover:text-[var(--up)] transition-colors">退出</button>
      </div>
      <div className="pb-2 flex items-center gap-2">
        <button onClick={handleRefresh} disabled={loadingApps} className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40">{loadingApps ? '刷新中...' : '刷新'}</button>
        <span className="text-[10px] text-[var(--text-3)]">{applications.length} 条记录</span>
      </div>
      <div className="flex flex-col gap-2 pb-8">
        {!loadingApps && applications.length === 0 && <div className="text-center text-[var(--text-3)] text-xs py-6">暂无申请</div>}
        {applications.map(app => (
          <div key={app.id} className="panel p-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--text)]">{app.phone}</div>
              {app.reason && <div className="text-[11px] text-[var(--text-2)] mt-0.5">{app.reason}</div>}
              <div className="text-[10px] text-[var(--text-3)] mt-1">
                {new Date(app.created_at).toLocaleDateString('zh-CN')}
                <span className={`ml-2 ${app.status === 'pending' ? 'text-[var(--gold)]' : app.status === 'approved' ? 'text-[var(--down)]' : 'text-[var(--up)]'}`}>
                  {app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              </div>
            </div>
            {app.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onApprove(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--down-soft)] text-[var(--down)] hover:bg-[var(--down)] hover:text-white transition-colors"><Check size={16}/></button>
                <button onClick={() => onReject(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--up-soft)] text-[var(--up)] hover:bg-[var(--up)] hover:text-white transition-colors"><X size={16}/></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
