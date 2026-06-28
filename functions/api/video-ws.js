// WebSocket relay via Pages Function — each room has its own set of connections
// Connections per room are stored in a global Map (OK for low-traffic use)

const rooms = new Map()

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, new Set())
  return rooms.get(id)
}

export async function onRequest({ request }) {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Video WS endpoint', { status: 200 })
  }

  const url = new URL(request.url)
  const roomId = url.searchParams.get('room') || 'default'

  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)

  server.accept()
  const room = getRoom(roomId)
  room.add(server)

  server.addEventListener('message', (event) => {
    room.forEach(s => {
      if (s !== server && s.readyState === 1) s.send(event.data)
    })
  })

  server.addEventListener('close', () => room.delete(server))
  server.addEventListener('error', () => room.delete(server))

  return new Response(null, { status: 101, webSocket: client })
}
