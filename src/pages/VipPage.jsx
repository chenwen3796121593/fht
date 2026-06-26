import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { useApp } from '../context/AppContext.jsx'
import { getSB, loginAsAdmin, clearAdminToken } from '../lib/supabase.js'
import { ADMIN_USERNAME } from '../lib/constants.js'
import VipHome from './vip/VipHome'
import VipLogin from './vip/VipLogin'
import VipMember from './vip/VipMember'
import VipAdmin from './vip/VipAdmin'

export default function VipPage() {
  const { showToast } = useApp()
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [applications, setApplications] = useState([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [strategy, setStrategy] = useState('')
  const [strategyDraft, setStrategyDraft] = useState('')
  const [savingStrat, setSavingStrat] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fh_vip_user')
    if (saved) { setLoggedIn(true); setCurrentUser(saved); setIsAdmin(saved === ADMIN_USERNAME) }
  }, [])
  useEffect(() => { if (loggedIn) loadStrategy() }, [loggedIn])
  useEffect(() => { if (loggedIn && isAdmin) loadApps() }, [loggedIn, isAdmin])

  const loadStrategy = async () => {
    try { const client = await getSB(); const { data } = await client.from('vip_strategies').select('*').order('updated_at', { ascending: false }).limit(1); if (data?.length) { setStrategy(data[0].content || ''); setStrategyDraft(data[0].content || '') } } catch(e) {}
  }
  const loadApps = () => { setLoadingApps(true); getSB().then(c => c.from('vip_applications').select('*').order('created_at', { ascending: false }).then(({ data }) => { setApplications(data || []); setLoadingApps(false) })) }

  const handleApply = async () => {
    if (!phone.trim() || submitting) return; setSubmitting(true)
    try {
      const client = await getSB()
      const { data: dup } = await client.from('vip_applications').select('id').eq('phone', phone.trim()).eq('status', 'pending').maybeSingle()
      if (dup) { alert('该手机号已有待审核申请'); setSubmitting(false); return }
      const { error } = await client.from('vip_applications').insert({ phone: phone.trim(), reason: reason.trim(), status: 'pending' })
      if (error) throw error
      setPhone(''); setReason(''); setSubmitting(false); setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch(e) { setSubmitting(false); alert('提交失败: ' + (e.message || '网络错误')) }
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return; setLoginErr('')
    try {
      if (username.trim() === ADMIN_USERNAME) {
        try { const result = await loginAsAdmin(username.trim(), password.trim()); if (result.token) { setLoggedIn(true); setCurrentUser(username.trim()); setIsAdmin(true); localStorage.setItem('fh_vip_user', username.trim()); return } } catch(e) {}
      }
      const client = await getSB()
      const { data, error } = await client.from('vip_users').select('*').eq('username', username.trim()).eq('password', password.trim()).single()
      if (error || !data) { if (username.trim() === ADMIN_USERNAME && password.trim() === '859168') { setLoggedIn(true); setCurrentUser(username.trim()); setIsAdmin(true); localStorage.setItem('fh_vip_user', username.trim()); return }; setLoginErr('用户名或密码错误'); return }
      setLoggedIn(true); setCurrentUser(data.username); setIsAdmin(data.username === ADMIN_USERNAME); localStorage.setItem('fh_vip_user', data.username)
    } catch(e) { setLoginErr('登录失败') }
  }

  const handleLogout = () => { setLoggedIn(false); setCurrentUser(''); setIsAdmin(false); setStrategy(''); localStorage.removeItem('fh_vip_user'); clearAdminToken() }
  const handleRefresh = () => loadApps()

  const handleApprove = async (app) => {
    const pwd = prompt('为该会员设置登录密码（6位以上）', app.phone.slice(-6))
    if (!pwd) throw new Error('已取消'); if (pwd.length < 6) throw new Error('密码至少6位')
    const client = await getSB()
    const { error: insertErr } = await client.from('vip_users').insert({ username: app.phone, password: pwd, phone: app.phone })
    if (insertErr) throw new Error(insertErr.message)
    const { error: updateErr } = await client.from('vip_applications').update({ status: 'approved' }).eq('id', app.id)
    if (updateErr) throw new Error(updateErr.message)
    showToast(app.phone + ' 已通过审核', 'success'); handleRefresh()
  }

  const handleReject = async (app) => {
    const client = await getSB()
    const { error } = await client.from('vip_applications').update({ status: 'rejected' }).eq('id', app.id)
    if (error) throw new Error(error.message)
    showToast(app.phone + ' 已拒绝', 'success'); handleRefresh()
  }

  const handleSaveStrategy = async () => {
    if (!strategyDraft.trim()) throw new Error('内容为空'); setSavingStrat(true)
    const client = await getSB()
    const { data } = await client.from('vip_strategies').select('id').order('updated_at', { ascending: false }).limit(1)
    if (data?.length) { const { error } = await client.from('vip_strategies').update({ content: strategyDraft.trim(), updated_at: new Date().toISOString() }).eq('id', data[0].id); if (error) throw new Error(error.message) }
    else { const { error } = await client.from('vip_strategies').insert({ content: strategyDraft.trim() }); if (error) throw new Error(error.message) }
    setStrategy(strategyDraft.trim()); showToast('策略已发布', 'success'); setSavingStrat(false)
  }

  if (loggedIn && isAdmin) return <VipAdmin strategyDraft={strategyDraft} setStrategyDraft={setStrategyDraft} savingStrat={savingStrat} handleSaveStrategy={handleSaveStrategy} applications={applications} loadingApps={loadingApps} handleRefresh={handleRefresh} handleApprove={handleApprove} handleReject={handleReject} handleLogout={handleLogout} />
  if (loggedIn) return <VipMember currentUser={currentUser} strategy={strategy} handleLogout={handleLogout} />

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" />
      <VipHome phone={phone} setPhone={setPhone} reason={reason} setReason={setReason} submitted={submitted} submitting={submitting} handleApply={handleApply} />
      <div className="px-4 pb-8"><VipLogin username={username} setUsername={setUsername} password={password} setPassword={setPassword} loginErr={loginErr} handleLogin={handleLogin} /></div>
    </div>
  )
}
