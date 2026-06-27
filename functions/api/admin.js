// Cloudflare Pages Function — POST /api/admin
// Validates admin credentials against environment variables.
// Set ADMIN_USER, ADMIN_PASS, ADMIN_SECRET in Cloudflare Pages dashboard.

async function signToken(payload, secret) {
  const enc = new TextEncoder()
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: Math.floor(Date.now() / 1000) }
  const segments = [
    btoa(JSON.stringify(header)).replace(/=+$/, ''),
    btoa(JSON.stringify(body)).replace(/=+$/, ''),
  ]
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(segments.join('.')))
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return segments.join('.') + '.' + sigStr
}

async function verifyToken(token, secret) {
  try {
    const enc = new TextEncoder()
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigStr = parts[2].replace(/-/g, '+').replace(/_/g, '/')
    const sigBytes = Uint8Array.from(atob(sigStr), c => c.charCodeAt(0))
    return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(parts[0] + '.' + parts[1]))
  } catch {
    return false
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  // GET — health check
  if (request.method === 'GET') {
    return json({ ok: true })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // POST /api/admin — login
  if (!url.pathname.endsWith('/verify')) {
    try {
      const body = await request.json()
      const { username, password } = body

      const adminUser = env.ADMIN_USER || 'chen'
      const adminPass = env.ADMIN_PASS; if (!adminPass) return json({ error: 'Server config error' }, 500)
      const adminSecret = env.ADMIN_SECRET
      if (!adminSecret) return json({ error: 'Server config error' }, 500)

      if (username !== adminUser || password !== adminPass) {
        return json({ error: '用户名或密码错误' }, 401)
      }

      const token = await signToken({ user: username, exp: Math.floor(Date.now() / 1000) + 86400 }, adminSecret)
      return json({ token, user: username })
    } catch (e) {
      return json({ error: 'Invalid request' }, 400)
    }
  }

  // POST /api/admin/verify — token verification
  try {
    const body = await request.json()
    const adminSecret = env.ADMIN_SECRET
    if (!adminSecret) return json({ error: 'Server config error' }, 500)
    const valid = await verifyToken(body.token, adminSecret)
    return json({ valid })
  } catch (e) {
    return json({ valid: false })
  }
}
