// CF Function to send Web Push notifications
// Called when user initiates a video call to offline user

async function sendPush(subscription, payload, env) {
  const { endpoint, keys } = subscription
  const jwt = await makeJWT(env)
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '60',
      'Authorization': 'vapid t=' + jwt + ', k=' + env.VAPID_PUBLIC_KEY,
    },
    body: JSON.stringify(payload),
  })
  return res.ok
}

async function makeJWT(env) {
  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: 'https://fcm.googleapis.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'mailto:3796121593@qq.com',
  }
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('pkcs8',
    base64ToArrayBuffer(env.VAPID_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  )
  const segments = [header, payload].map(j => btoa(JSON.stringify(j)).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_'))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(segments.join('.')))
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return segments.join('.') + '.' + sigStr
}

function base64ToArrayBuffer(b64) {
  return Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer
}

export async function onRequest({ request, env }) {
  try {
    const body = await request.json()
    const { username, from, roomId } = body
    if (!username) return json({ error: 'missing username' }, 400)

    // Look up push subscriptions for target user
    const { data: subs } = await fetch(
      'https://fxpxlobftrdlswyhrnhv.supabase.co/rest/v1/push_tokens?select=*&username=eq.' + encodeURIComponent(username),
      { headers: { apikey: 'sb_publishable_nRjPbFK5D4BRzyJyh_-ahw_mivVK7Zq', Authorization: 'Bearer sb_publishable_nRjPbFK5D4BRzyJyh_-ahw_mivVK7Zq' } }
    ).then(r => r.json()).catch(() => ({}))

    const tokens = Array.isArray(subs) ? subs : (subs?.data || [])
    if (!tokens.length) return json({ sent: 0, message: 'no tokens' })

    let sent = 0
    for (const sub of tokens) {
      try {
        const pushPayload = { title: '📹 视频通话', body: from + ' 邀请你视频通话', type: 'call', from, roomId, icon: '/icon-192.png' }
        if (await sendPush(JSON.parse(sub.subscription), pushPayload, env)) sent++
      } catch {}
    }
    return json({ sent })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}
