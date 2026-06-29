export class VideoRoom {
  constructor(state, env) { this.sessions = [] }

  async fetch(req) {
    const reqUrl = typeof req === 'string' ? new URL(req) : new URL(req.url)
    if (reqUrl.pathname === '/sessions') {
      return new Response('Sessions:' + this.sessions.length)
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.sessions.push(server)
    server.accept()

    server.addEventListener('message', (e) => {
      this.sessions = this.sessions.filter(s => s.readyState === 1)
      this.sessions.forEach(s => { if (s !== server) s.send(e.data) })
    })

    server.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }
}
