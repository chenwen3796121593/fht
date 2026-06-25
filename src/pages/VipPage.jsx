import { useState } from 'react'
import TopBar from '../components/TopBar'
import { Crown, User, Key, Send, LogIn, Shield, Sparkles } from 'lucide-react'

export default function VipPage({ onNavigate }) {
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginErr, setLoginErr] = useState('')

  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem('fh_vip_users') || '[]') } catch { return [] }
  }

  const handleApply = () => {
    if (!phone.trim()) return
    const apps = JSON.parse(localStorage.getItem('fh_vip_apps') || '[]')
    apps.push({ phone: phone.trim(), reason: reason.trim(), time: new Date().toISOString() })
    localStorage.setItem('fh_vip_apps', JSON.stringify(apps))
    setPhone(''); setReason('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) return
    const users = getUsers()
    const user = users.find(u => u.username === username.trim() && u.password === password.trim())
    if (user) {
      setLoggedIn(true)
      setLoginErr('')
      localStorage.setItem('fh_vip_user', username.trim())
    } else {
      setLoginErr('用户名或密码错误')
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    localStorage.removeItem('fh_vip_user')
  }

  const aiDesc = 'VIP 客户专享预测大模型AI服务：基于多维度市场数据\n与深度学习算法，提供商品趋势预测和智能择时信号。'

  if (loggedIn) {
    return (
      <div className="bg-[#0A0F14] h-full overflow-y-auto">
        <TopBar active="vip" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onIndicators={() => onNavigate('indicators')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} onVip={() => onNavigate('vip')} />

        <div className="px-4 pt-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center">
            <Crown size={32} className="text-[#F59E0B]" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#F0F2F5]">VIP 专区</div>
            <div className="text-xs text-[#8D949E] mt-1">欢迎回来，{username}</div>
          </div>

          <div className="w-full rounded-xl px-1 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#F59E0B]" />
              <span className="text-sm font-bold text-[#F59E0B]">预测大模型AI服务</span>
            </div>
            <div className="text-xs text-[#8D949E] leading-relaxed whitespace-pre-line">{aiDesc}</div>
          </div>

          <div className="w-full bg-[#12161C] border border-[#242B33] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#F0F2F5]">VIP 专属功能</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-[#8D949E]">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />AI 趋势预测</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />实时异动监控</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />机构持仓追踪</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />深度行业研报</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />VIP 交流群组</div>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full py-2.5 rounded-lg bg-[#1A2129] text-[#8D949E] text-sm font-medium hover:bg-[#242B33] transition-colors">
            退出登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0A0F14] h-full overflow-y-auto">
      <TopBar active="vip" onHome={() => onNavigate('home')} onStocks={() => onNavigate('dashboard')} onIndicators={() => onNavigate('indicators')} onNews={() => onNavigate('news')} onChat={() => onNavigate('chat')} onAlerts={() => onNavigate('alerts')} onVip={() => onNavigate('vip')} />

      <div className="px-4 pt-5 pb-1 flex items-center gap-2">
        <Crown size={18} className="text-[#F59E0B]" />
        <span className="text-sm font-bold text-[#F0F2F5]">VIP 专区</span>
      </div>

      {/* AI banner */}
      <div className="px-4 pb-4">
        <div className="rounded-xl px-1 py-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={16} className="text-[#F59E0B]" />
            <span className="text-sm font-bold text-[#F59E0B]">预测大模型AI服务</span>
          </div>
          <div className="text-[11px] text-[#8D949E] leading-relaxed whitespace-pre-line">{aiDesc}</div>
        </div>
      </div>

      {/* Application */}
      <div className="px-4 pb-4">
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-[#3B82F6]" />
            <span className="text-xs font-semibold text-[#F0F2F5]">申请 VIP</span>
          </div>
          {submitted ? (
            <div className="text-center py-4 text-sm text-[#22C55E] font-medium">申请已提交 ✓</div>
          ) : (
            <>
              <input
                className="w-full bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2.5 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]"
                placeholder="手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <textarea
                className="bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2 text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C] resize-none h-16"
                placeholder="申请理由"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              <button onClick={handleApply} disabled={!phone.trim()}
                className="w-full py-2.5 rounded-md bg-[#3B82F6] text-white text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all">
                提交申请
              </button>
            </>
          )}
        </div>
      </div>

      {/* Login */}
      <div className="px-4 pb-8">
        <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LogIn size={14} className="text-[#F59E0B]" />
            <span className="text-xs font-semibold text-[#F0F2F5]">VIP 登录</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2">
            <User size={14} className="text-[#4D545C]" />
            <input
              className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]"
              placeholder="用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2">
            <Key size={14} className="text-[#4D545C]" />
            <input
              className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]"
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          {loginErr && <div className="text-xs text-[#EF4444]">{loginErr}</div>}
          <button onClick={handleLogin} disabled={!username.trim() || !password.trim()}
            className="w-full py-2.5 rounded-md bg-[#F59E0B] text-[#0A0F14] text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all">
            登录
          </button>
        </div>
      </div>
    </div>
  )
}
