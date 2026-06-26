import { SUPABASE_URL, SUPABASE_KEY } from './constants.js'

let sb = null

export async function getSB() {
  if (!sb) {
    const { createClient } = await import('@supabase/supabase-js')
    sb = createClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return sb
}

// 管理员登录（调 Cloudflare Function 后端校验）
export async function loginAsAdmin(username, password) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('登录失败')
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('fh_admin_token', data.token)
  }
  return data
}

export function getAdminToken() {
  return localStorage.getItem('fh_admin_token')
}

export function clearAdminToken() {
  localStorage.removeItem('fh_admin_token')
}
