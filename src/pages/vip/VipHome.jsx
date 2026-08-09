export default function VipHome({ phone, setPhone, reason, setReason, submitted, submitting, handleApply }) {
  return (
    <div className="pb-4">
      <div className="panel p-4 flex flex-col gap-3">
        <span className="text-xs font-semibold text-[var(--text)]">申请 VIP</span>
        {submitted
          ? <div className="text-center py-4 text-sm text-[var(--down)] font-medium">申请已提交，等待审核 ✓</div>
          : <>
            <input className="field" placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)} />
            <textarea className="field resize-none h-16" placeholder="申请理由" value={reason} onChange={e => setReason(e.target.value)} />
            <button onClick={handleApply} disabled={!phone.trim() || submitting} className="btn-gold w-full disabled:opacity-40">{submitting ? '提交中...' : '提交申请'}</button>
          </>
        }
      </div>
    </div>
  )
}
