import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { Crown, User, Key, Send, LogIn, Shield, Sparkles, Check, X, Edit3 } from 'lucide-react'

const SUPABASE_URL = 'https://fxpxlobftrdlswyhrnhv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nRjPbFK5D4BRzyJyh_-ahw_mivVK7Zq'
let sb = null
async function getSB() {
  if (!sb) { const { createClient } = await import('@supabase/supabase-js'); sb = createClient(SUPABASE_URL, SUPABASE_KEY) }
  return sb
}

const ADMIN_USER = 'chen'
const ADMIN_PASS = '859168'

export default function VipPage({ onNavigate }) {
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
    if (saved) { setLoggedIn(true); setCurrentUser(saved); setIsAdmin(saved === ADMIN_USER) }
  }, [])
  useEffect(() => { if (loggedIn) loadStrategy() }, [loggedIn])
  useEffect(() => { if (loggedIn && isAdmin) loadApps() }, [loggedIn, isAdmin])

  const loadStrategy = async () => {
    try {
      const client = await getSB()
      const { data } = await client.from('vip_strategies').select('*').order('updated_at', { ascending: false }).limit(1)
      if (data && data.length > 0) { setStrategy(data[0].content || ''); setStrategyDraft(data[0].content || '') }
    } catch(e) {}
  }
  const loadApps = () => {
    setLoadingApps(true)
    getSB().then(c => c.from('vip_applications').select('*').order('created_at', { ascending: false }).then(({ data }) => { setApplications(data || []); setLoadingApps(false) }))
  }
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
    if (!username.trim() || !password.trim()) return
    try {
      const client = await getSB()
      const { data, error } = await client.from('vip_users').select('*').eq('username', username.trim()).eq('password', password.trim()).single()
      if (error || !data) { setLoginErr('用户名或密码错误'); return }
      setLoggedIn(true); setCurrentUser(data.username); setIsAdmin(data.username === ADMIN_USER)
      setLoginErr(''); localStorage.setItem('fh_vip_user', data.username)
    } catch(e) { setLoginErr('登录失败') }
  }
  const handleLogout = () => {
    setLoggedIn(false); setCurrentUser(''); setIsAdmin(false); setStrategy('')
    localStorage.removeItem('fh_vip_user')
  }
  const handleRefresh = () => loadApps()
  const handleApprove = async (app) => {
    const pwd = prompt('设置登录密码', app.phone.slice(-6))
    if (!pwd) return
    try { const client = await getSB(); await client.from('vip_users').insert({ username: app.phone, password: pwd, phone: app.phone }); await client.from('vip_applications').update({ status: 'approved' }).eq('id', app.id); handleRefresh() } catch(e) { alert('操作失败') }
  }
  const handleReject = async (app) => {
    try { const client = await getSB(); await client.from('vip_applications').update({ status: 'rejected' }).eq('id', app.id); handleRefresh() } catch(e) {}
  }
  const handleSaveStrategy = async () => {
    if (!strategyDraft.trim()) return; setSavingStrat(true)
    try {
      const client = await getSB()
      const { data } = await client.from('vip_strategies').select('id').order('updated_at', { ascending: false }).limit(1)
      if (data && data.length > 0) { await client.from('vip_strategies').update({ content: strategyDraft.trim(), updated_at: new Date().toISOString() }).eq('id', data[0].id) }
      else { await client.from('vip_strategies').insert({ content: strategyDraft.trim() }) }
      setStrategy(strategyDraft.trim())
    } catch(e) { alert('保存失败') }
    setSavingStrat(false)
  }
  const aiDesc = 'VIP 客户专享预测大模型AI服务：基于多维度市场数据\n与深度学习算法，提供商品趋势预测和智能择时信号。'

  if (loggedIn && isAdmin) return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" onHome={()=>onNavigate('home')} onStocks={()=>onNavigate('dashboard')} onIndicators={()=>onNavigate('indicators')} onNews={()=>onNavigate('news')} onChat={()=>onNavigate('chat')} onAlerts={()=>onNavigate('alerts')} onVip={()=>onNavigate('vip')} />
      <div className="px-4 pt-4 pb-3"><div className="bg-[#12161C] border border-[#F59E0B]/30 rounded-xl p-4 flex flex-col gap-3"><div className="flex items-center gap-2"><Edit3 size={14} className="text-[#F59E0B]"/><span className="text-xs font-semibold text-[#F0F2F5]">今日策略</span></div><textarea className="bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C] resize-none h-32" placeholder="写下今日交易策略..." value={strategyDraft} onChange={e=>setStrategyDraft(e.target.value)}/><button onClick={handleSaveStrategy} disabled={savingStrat||!strategyDraft.trim()} className="py-2 rounded-md bg-[#F59E0B] text-[#0A0F14] text-sm font-bold disabled:opacity-40">{savingStrat?'发布中...':'发布策略'}</button></div></div>
      <div className="px-4 pb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Crown size={18} className="text-[#F59E0B]"/><span className="text-sm font-bold text-[#F0F2F5]">申请管理</span></div><button onClick={handleLogout} className="text-xs text-[#4D545C] hover:text-[#EF4444]">退出</button></div>
      <div className="px-4 pb-2 flex items-center gap-2"><button onClick={handleRefresh} disabled={loadingApps} className="py-1.5 px-3 rounded-md bg-[#1A2129] text-[#8D949E] text-xs font-medium hover:bg-[#242B33]">{loadingApps?'刷新中...':'刷新'}</button><span className="text-[10px] text-[#4D545C]">{applications.length} 条记录</span></div>
      <div className="px-4 flex flex-col gap-2 pb-8">
        {!loadingApps&&applications.length===0&&<div className="text-center text-[#4D545C] text-xs py-6">暂无申请</div>}
        {applications.map(app=>(<div key={app.id} className="bg-[#12161C] rounded-lg p-3.5 flex items-center justify-between"><div><div className="text-sm text-[#F0F2F5]">{app.phone}</div>{app.reason&&<div className="text-[11px] text-[#6B7280] mt-0.5">{app.reason}</div>}<div className="text-[10px] text-[#4D545C] mt-1">{new Date(app.created_at).toLocaleDateString('zh-CN')}<span className={`ml-2 ${app.status==='pending'?'text-[#F59E0B]':app.status==='approved'?'text-[#22C55E]':'text-[#EF4444]'}`}>{app.status==='pending'?'待审核':app.status==='approved'?'已通过':'已拒绝'}</span></div></div>{app.status==='pending'&&<div className="flex gap-2"><button onClick={()=>handleApprove(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30"><Check size={16}/></button><button onClick={()=>handleReject(app)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30"><X size={16}/></button></div>}</div>))}
      </div>
    </div>
  )
  if (loggedIn) return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" onHome={()=>onNavigate('home')} onStocks={()=>onNavigate('dashboard')} onIndicators={()=>onNavigate('indicators')} onNews={()=>onNavigate('news')} onChat={()=>onNavigate('chat')} onAlerts={()=>onNavigate('alerts')} onVip={()=>onNavigate('vip')} />
      <div className="px-4 pt-5 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0"><Crown size={24} className="text-[#F59E0B]"/></div><div><div className="text-base font-bold text-[#F0F2F5] leading-tight">VIP 专区</div><div className="text-xs text-[#8D949E]">{currentUser}</div></div></div>
        {strategy&&<div className="w-full bg-[#12161C] border border-[#F59E0B]/30 rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><Edit3 size={14} className="text-[#F59E0B]"/><span className="text-xs font-semibold text-[#F59E0B]">今日策略</span></div><div className="text-xs text-[#D1D5DB] leading-relaxed whitespace-pre-wrap min-h-[140px]">{strategy}</div></div>}
        <div className="w-full bg-[#12161C] border border-[#242B33] rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-[#F59E0B]"/><span className="text-sm font-semibold text-[#F0F2F5]">VIP 专属功能</span></div><div className="grid grid-cols-2 gap-2 text-xs text-[#8D949E]"><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>AI 趋势预测</div><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>实时异动监控</div><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>机构持仓追踪</div><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>深度行业研报</div></div></div>
        <button onClick={handleLogout} className="w-full py-2.5 rounded-lg bg-[#1A2129] text-[#8D949E] text-sm font-medium hover:bg-[#242B33]">退出登录</button>
      </div>
    </div>
  )
  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" onHome={()=>onNavigate('home')} onStocks={()=>onNavigate('dashboard')} onIndicators={()=>onNavigate('indicators')} onNews={()=>onNavigate('news')} onChat={()=>onNavigate('chat')} onAlerts={()=>onNavigate('alerts')} onVip={()=>onNavigate('vip')} />
      <div className="px-4 pt-5 pb-1 flex items-center gap-2"><Crown size={18} className="text-[#F59E0B]"/><span className="text-sm font-bold text-[#F0F2F5]">VIP 专区</span></div>
      <div className="px-4 pb-4"><div className="rounded-xl px-1 py-3.5"><div className="flex items-center gap-2 mb-1.5"><Sparkles size={16} className="text-[#F59E0B]"/><span className="text-sm font-bold text-[#F59E0B]">预测大模型AI服务</span></div><div className="text-[11px] text-[#8D949E] leading-relaxed whitespace-pre-line">{aiDesc}</div></div></div>
      <div className="px-4 pb-4"><div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3"><div className="flex items-center gap-2"><Send size={14} className="text-[#3B82F6]"/><span className="text-xs font-semibold text-[#F0F2F5]">申请 VIP</span></div>{submitted?<div className="text-center py-4 text-sm text-[#22C55E] font-medium">申请已提交，等待审核 ✓</div>:<><input className="w-full bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2.5 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" placeholder="手机号" value={phone} onChange={e=>setPhone(e.target.value)}/><textarea className="bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C] resize-none h-16" placeholder="申请理由" value={reason} onChange={e=>setReason(e.target.value)}/><button onClick={handleApply} disabled={!phone.trim()||submitting} className="w-full py-2.5 rounded-md bg-[#3B82F6] text-white text-sm font-medium disabled:opacity-40">{submitting?'提交中...':'提交申请'}</button></>}</div></div>
      <div className="px-4 pb-8"><div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3"><div className="flex items-center gap-2"><LogIn size={14} className="text-[#F59E0B]"/><span className="text-xs font-semibold text-[#F0F2F5]">VIP 登录</span></div><div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2"><User size={14} className="text-[#4D545C]"/><input className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" placeholder="用户名" value={username} onChange={e=>setUsername(e.target.value)}/></div><div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2"><Key size={14} className="text-[#4D545C]"/><input className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/></div>{loginErr&&<div className="text-xs text-[#EF4444]">{loginErr}</div>}<button onClick={handleLogin} disabled={!username.trim()||!password.trim()} className="w-full py-2.5 rounded-md bg-[#F59E0B] text-[#0A0F14] text-sm font-bold disabled:opacity-40">登录</button></div></div>
    </div>
  )
}
