import { useState } from 'react'
import TopBar from '../../components/TopBar'
import { Crown, Edit3, Check, X } from 'lucide-react'

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
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" />

      {/* Strategy editor */}
      <div className="px-4 pt-4 pb-3">
        <div className="bg-[#12161C] border border-[#F59E0B]/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2"><Edit3 size={14} className="text-[#F59E0B]"/><span className="text-xs font-semibold text-[#F0F2F5]">今日策略</span></div>
          <textarea className="bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C] resize-none h-32" placeholder="写下今日交易策略..." value={strategyDraft} onChange={e => setStrategyDraft(e.target.value)} />
          <button onClick={onSave} disabled={savingStrat || !strategyDraft.trim()} className="py-2 rounded-md bg-[#F59E0B] text-[#0A0F14] text-sm font-bold disabled:opacity-40">{savingStrat ? '发布中...' : '发布策略'}</button>
          {statusMsg && <div className={`text-xs font-medium text-center ${statusMsg.startsWith('✅') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{statusMsg}</div>}
        </div>
      </div>

      {/* Application management */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2"><Crown size={18} className="text-[#F59E0B]"/><span className="text-sm font-bold text-[#F0F2F5]">申请管理</span></div>
        <button onClick={handleLogout} className="text-xs text-[#4D545C] hover:text-[#EF4444]">退出</button>
      </div>
      <div className="px-4 pb-2 flex items-center gap-2">
        <button onClick={handleRefresh} disabled={loadingApps} className="py-1.5 px-3 rounded-md bg-[#1A2129] text-[#8D949E] text-xs font-medium hover:bg-[#242B33]">{loadingApps ? '刷新中...' : '刷新'}</button>
        <span className="text-[10px] text-[#4D545C]">{applications.length} 条记录</span>
      </div>
      <div className="px-4 flex flex-col gap-2 pb-8">
        {!loadingApps && applications.length === 0 && <div className="text-center text-[#4D545C] text-xs py-6">暂无申请</div>}
        {applications.map(app => (
          <div key={app.id} className="bg-[#12161C] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm text-[#F0F2F5]">{app.phone}</div>
              {app.reason && <div className="text-[11px] text-[#6B7280] mt-0.5">{app.reason}</div>}
              <div className="text-[10px] text-[#4D545C] mt-1">
                {new Date(app.created_at).toLocaleDateString('zh-CN')}
                <span className={`ml-2 ${app.status === 'pending' ? 'text-[#F59E0B]' : app.status === 'approved' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              </div>
            </div>
            {app.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onApprove(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30"><Check size={16}/></button>
                <button onClick={() => onReject(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30"><X size={16}/></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
