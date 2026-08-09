import { User, Key } from 'lucide-react'

export default function VipLogin({ username, setUsername, password, setPassword, loginErr, handleLogin }) {
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <span className="text-xs font-semibold text-[var(--text)]">VIP 登录</span>
      <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2.5 focus-within:border-[var(--gold)] transition-colors">
        <User size={14} className="text-[var(--text-3)]"/>
        <input className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-3)]" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2.5 focus-within:border-[var(--gold)] transition-colors">
        <Key size={14} className="text-[var(--text-3)]"/>
        <input className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-3)]" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
      </div>
      {loginErr && <div className="text-xs text-[var(--up)]">{loginErr}</div>}
      <button onClick={handleLogin} disabled={!username.trim() || !password.trim()} className="btn-gold w-full disabled:opacity-40">登录</button>
    </div>
  )
}
