import { useEffect, useRef } from 'react'

export default function useAlertChecker(prices) {
  const lastAlerted = useRef({})

  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return

    try {
      const alerts = JSON.parse(localStorage.getItem('fh_alerts') || '[]')
      if (alerts.length === 0) return

      for (const alert of alerts) {
        if (!alert.active || !alert.symbol) continue
        const priceData = prices[alert.symbol]
        if (!priceData || !priceData.price || priceData.price <= 0) continue

        const hp = priceData.price
        const cp = priceData.prevClose || hp
        const pct = cp ? ((hp - cp) / cp * 100) : 0
        let triggered = false

        if (alert.type === 'pct' && Math.abs(pct) >= alert.value) triggered = true
        else if (alert.type === 'price_up' && hp >= alert.value) triggered = true
        else if (alert.type === 'price_down' && hp <= alert.value) triggered = true

        if (triggered) {
          const key = alert.symbol + ':' + alert.type + ':' + alert.value
          const last = lastAlerted.current[key] || 0
          if (Date.now() - last > 300000) {
            lastAlerted.current[key] = Date.now()

            // Update trigger time in localStorage
            alert.triggered = new Date().toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
            const stored = JSON.parse(localStorage.getItem('fh_alerts') || '[]')
            const updated = stored.map(a => a.id === alert.id ? alert : a)
            localStorage.setItem('fh_alerts', JSON.stringify(updated))

            const methods = alert.methods || []
            const msg = `${alert.name} ${alert.type==='pct'?'涨跌幅超±'+alert.value+'%':alert.type==='price_up'?'突破'+alert.value:'跌破'+alert.value}，当前${hp}`

            // Push notification (via Service Worker)
            if (methods.includes('push') && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 烽火台预警', { body: msg, icon: '/icon-192.png', vibrate: [200, 100, 200], tag: 'fh-alert' })
            }

            // Vibration
            if (methods.includes('vibrate') && 'vibrate' in navigator) {
              try { navigator.vibrate([200, 100, 200]) } catch(e) {}
            }

            // Voice
            if (methods.includes('voice') && 'speechSynthesis' in window) {
              try {
                const u = new SpeechSynthesisUtterance(msg)
                u.lang = 'zh-CN'; u.rate = 1.0
                speechSynthesis.cancel()
                speechSynthesis.speak(u)
              } catch(e) {}
            }
          }
        }
      }
    } catch(e) {}
  }, [prices])
}
