import { User, Key, LogIn } from 'lucide-react'

export default function VipLogin({ username, setUsername, password, setPassword, loginErr, handleLogin }) {
  return (
    <div className="bg-[#12161C] border border-[#242B33] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2"><LogIn size={14} className="text-[#3B82F6]"/><span className="text-xs font-semibold text-[#F0F2F5]">VIP 登录</span></div>
      <div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2"><User size={14} className="text-[#4D545C]"/><input className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div className="flex items-center gap-2 bg-[#1A2129] border border-[#242B33] rounded-md px-3 py-2"><Key size={14} className="text-[#4D545C]"/><input className="flex-1 bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#4D545C]" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} /></div>
      {loginErr && <div className="text-xs text-[#EF4444]">{loginErr}</div>}
      <button onClick={handleLogin} disabled={!username.trim() || !password.trim()} className="w-full py-2.5 rounded-md bg-[#3B82F6] text-white text-sm font-bold disabled:opacity-40">登录</button>
    </div>
  )
}
