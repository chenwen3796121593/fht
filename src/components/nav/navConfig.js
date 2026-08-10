import { LineChart, Star, MessageCircle, Sparkles, Coins } from 'lucide-react'
import { useState, useEffect } from 'react'

// 导航单一真源：新增/改名页面只改这里，三个导航组件自动同步
export const PAGES = ['home', 'dashboard', 'chat', 'alerts', 'commodities']

export const ICONS = {
  home: LineChart,
  dashboard: Star,
  chat: MessageCircle,
  alerts: Sparkles,
  commodities: Coins,
}

export const LABELS = {
  home: '行情',
  dashboard: '自选',
  chat: '聊天',
  alerts: 'AI',
  commodities: '黄金',
}

export function useClock() {
  const fmt = () =>
    new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const t = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

export function hasMentionBadge() {
  try {
    return parseInt(localStorage.getItem('fh_mention_badge') || '0') > 0
  } catch {
    return false
  }
}
