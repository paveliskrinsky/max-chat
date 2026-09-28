import type {
  Credentials,
  InstanceSettings,
  InstanceState,
  ReceivedNotification,
} from './types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

/**
 * У каждого инстанса свой хост API. Он указан в личном кабинете (поле apiUrl),
 * а по умолчанию совпадает с первыми 4 цифрами idInstance: 3100123456 → https://3100.api.green-api.com
 */
export function guessApiUrl(idInstance: string): string {
  const digits = idInstance.replace(/\D/g, '')
  return digits.length >= 4
    ? `https://${digits.slice(0, 4)}.api.green-api.com`
    : 'https://api.green-api.com'
}

async function request<T>(
  creds: Credentials,
  method: string,
  httpMethod: 'GET' | 'POST' | 'DELETE',
  options: { body?: unknown; suffix?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const base = creds.apiUrl.replace(/\/+$/, '')
  const url = `${base}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${options.suffix ?? ''}`

  const response = await fetch(url, {
    method: httpMethod,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new GreenApiError(response.status, describeError(response.status, text))
  }
  return (text ? JSON.parse(text) : null) as T
}

function describeError(status: number, text: string): string {
  if (status === 401) return 'Неверный idInstance или apiTokenInstance'
  if (status === 403) return 'Доступ запрещён: проверьте учётные данные и статус инстанса'
  if (status === 429) return 'Слишком много запросов, попробуйте позже'
  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (parsed.message) return parsed.message
  } catch {
    // ответ не JSON — используем как есть
  }
  return text || `Ошибка HTTP ${status}`
}

export function getStateInstance(creds: Credentials) {
  return request<{ stateInstance: InstanceState }>(creds, 'getStateInstance', 'GET')
}

export function getSettings(creds: Credentials) {
  return request<InstanceSettings>(creds, 'getSettings', 'GET')
}

export async function checkAccount(creds: Credentials, phoneNumber: string) {
  const result = await request<{ exist?: boolean; chatId?: string; reason?: string }>(
    creds,
    'checkAccount',
    'POST',
    { body: { phoneNumber: Number(phoneNumber) } },
  )
  if (result.reason) throw new GreenApiError(200, result.reason)
  return { exist: Boolean(result.exist), chatId: result.chatId ?? '' }
}

export function sendMessage(creds: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(creds, 'sendMessage', 'POST', {
    body: { chatId, message },
  })
}

/** Long polling: ждёт уведомление до receiveTimeout секунд, при пустой очереди возвращает null. */
export function receiveNotification(
  creds: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
) {
  return request<ReceivedNotification | null>(creds, 'receiveNotification', 'GET', {
    suffix: `?receiveTimeout=${receiveTimeout}`,
    signal,
  })
}

export function deleteNotification(creds: Credentials, receiptId: number, signal?: AbortSignal) {
  return request<{ result: boolean }>(creds, 'deleteNotification', 'DELETE', {
    suffix: `/${receiptId}`,
    signal,
  })
}
