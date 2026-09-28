import { useEffect, useRef, useState } from 'react'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import type { Credentials, NotificationBody } from '../api/types'

export type PollingStatus = 'online' | 'error'

const RECEIVE_TIMEOUT_SECONDS = 20
const RETRY_DELAY_MS = 3000

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })

/**
 * Получение входящих через HTTP API: receiveNotification (long polling) →
 * обработка → deleteNotification, чтобы очередь отдала следующее уведомление.
 */
export function useNotificationPolling(
  creds: Credentials,
  onNotification: (body: NotificationBody) => void,
) {
  // Связь с API уже проверена при входе, поэтому стартуем в 'online'
  const [status, setStatus] = useState<PollingStatus>('online')
  const [error, setError] = useState<string | null>(null)
  const handlerRef = useRef(onNotification)

  useEffect(() => {
    handlerRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function loop() {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(creds, RECEIVE_TIMEOUT_SECONDS, signal)
          setStatus('online')
          setError(null)
          if (!notification) continue

          try {
            handlerRef.current(notification.body)
          } finally {
            // Удаляем даже при ошибке обработки, иначе очередь «застрянет» на этом уведомлении
            await deleteNotification(creds, notification.receiptId, signal)
          }
        } catch (e) {
          if (signal.aborted) return
          setStatus('error')
          setError(e instanceof Error ? e.message : String(e))
          await sleep(RETRY_DELAY_MS, signal)
        }
      }
    }

    loop()
    return () => controller.abort()
  }, [creds])

  return { status, error }
}
