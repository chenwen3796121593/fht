export { VideoRoom } from './video-room.js'

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    const roomId = url.pathname.split('/').pop() || 'default'
    const id = env.VIDEO_ROOM.idFromName(roomId)
    const stub = env.VIDEO_ROOM.get(id)

    if (req.headers.get('Upgrade') === 'websocket') {
      return stub.fetch(req)
    }

    // Plain http → return session count for debugging
    const count = await stub.fetch('http://internal/sessions')
    const text = await count.text()
    return new Response(text, { status: 200 })
  }
}
