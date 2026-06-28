// Cloudflare Worker + Durable Object — WebSocket signaling relay
export { VideoRoom } from './video-room.js'

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    const roomId = url.pathname.split('/').pop() || 'default'

    if (req.headers.get('Upgrade') === 'websocket') {
      const id = env.VIDEO_ROOM.idFromName(roomId)
      const stub = env.VIDEO_ROOM.get(id)
      return stub.fetch(req)
    }

    return new Response('Fenghuotai Video OK', { status: 200 })
  }
}
