const aiDesc = 'VIP 客户专享预测大模型AI服务：基于多维度市场数据\n与深度学习算法，提供商品股票趋势预测和智能择时信号。'

export default function VipHome({ phone, setPhone, reason, setReason, submitted, submitting, handleApply }) {
  return (
    <>
      <div className="px-4 pb-4">
        <div className="rounded-xl px-1 py-3.5 pt-5">
          <div className="mb-1.5"><span className="text-sm font-bold text-[#F0F2F5]">预测大模型AI服务</span></div>
          <div className="text-[11px] text-[#D1D5DB] leading-relaxed whitespace-pre-line">{aiDesc}</div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3">
          <span className="text-xs font-semibold text-[#F0F2F5]">申请 VIP</span>
          {submitted
            ? <div className="text-center py-4 text-sm text-[#D1D5DB] font-medium">申请已提交，等待审核 ✓</div>
            : <>
              <input className="w-full bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2.5 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)} />
              <textarea className="bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C] resize-none h-16" placeholder="申请理由" value={reason} onChange={e => setReason(e.target.value)} />
              <button onClick={handleApply} disabled={!phone.trim() || submitting} className="w-full py-2.5 rounded-md bg-[#3B82F6] text-white text-sm font-medium disabled:opacity-40">{submitting ? '提交中...' : '提交申请'}</button>
            </>
          }
        </div>
      </div>
    </>
  )
}
