import { useState, useEffect, useRef } from 'react'
import { showToast } from '../components/Toast.js'

export default function useNetworkStatus(fetchFn) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const failCountRef = useRef(0)
  const warnedRef = useRef(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('网络已恢复', 'success')
      failCountRef.current = 0
      warnedRef.current = false
    }
    const handleOffline = () => {
      setIsOnline(false)
      showToast('网络已断开，数据可能延迟', 'error')
      warnedRef.current = true
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // This can be called from catch blocks to track failures
  const reportFailure = () => {
    if (!navigator.onLine) return
    failCountRef.current++
    if (failCountRef.current >= 3 && !warnedRef.current) {
      showToast('网络异常，数据可能延迟', 'error')
      warnedRef.current = true
    }
  }

  const reportSuccess = () => {
    failCountRef.current = 0
    if (warnedRef.current) {
      showToast('连接已恢复', 'success')
      warnedRef.current = false
    }
  }

  return { isOnline, reportFailure, reportSuccess }
}
