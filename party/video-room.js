// Durable Object — one instance per video room
// Stores connected WebSocket clients and broadcasts messages

export class VideoRoom {
  constructor(state, env) {
    this.sockets = new Map()
  }

  async fetch(req) {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    const id = crypto.randomUUID()
    this.sockets.set(id, server)
    server.accept()

    server.addEventListener('message', (event) => {
      this.sockets.forEach((s, sid) => {
        if (sid !== id && s.readyState === 1) {
          s.send(event.data)
        }
      })
    })

    server.addEventListener('close', () => this.sockets.delete(id))
    server.addEventListener('error', () => this.sockets.delete(id))

    return new Response(null, { status: 101, webSocket: client })
  }
}
