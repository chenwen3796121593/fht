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
          // Don't spam - max once per 5 minutes
          if (Date.now() - last > 300000) {
            lastAlerted.current[key] = Date.now()

            // Update alert trigger time
            alert.triggered = new Date().toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
            const updated = alerts.map(a => a.id === alert.id ? alert : a)
            localStorage.setItem('fh_alerts', JSON.stringify(updated))

            // Send push notification
            const methods = alert.methods || []
            const msg = `${alert.name} ${alert.type==='pct'?'涨跌幅超±'+alert.value+'%':alert.type==='price_up'?'突破$'+alert.value:'跌破$'+alert.value}，当前${hp}`
            if (methods.includes('push') && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 烽火台预警', { body: msg, icon: '/icon-192.png', vibrate: [200,100,200] })
            }
            if (methods.includes('voice') && 'speechSynthesis' in window) {
              const u = new SpeechSynthesisUtterance(msg); u.lang = 'zh-CN'; u.rate = 1.0; speechSynthesis.speak(u)
            }
          }
        }
      }
    } catch(e) {}
  }, [prices])
}
