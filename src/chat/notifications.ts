import type {
  MessageNotification,
  NotificationBody,
  OutgoingStatus,
  StatusNotification,
} from '../api/types'
import type { Message, MessageStatus } from './types'

export type ParsedNotification =
  | {
      kind: 'message'
      chatId: string
      phone?: string
      chatName?: string
      message: Message
    }
  | {
      kind: 'status'
      chatId: string
      idMessage: string
      status: MessageStatus
      error?: string
    }

const MESSAGE_WEBHOOKS = new Set([
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
])

const STATUS_MAP: Record<OutgoingStatus, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
}

const STATUS_ERRORS: Partial<Record<OutgoingStatus, string>> = {
  failed: 'Не удалось отправить сообщение',
  noAccount: 'У получателя нет аккаунта MAX',
  notInGroup: 'Вы не состоите в этой группе',
}

function extractText(data: MessageNotification['messageData']): string | null {
  switch (data.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? ''
    case 'extendedTextMessage':
      return data.extendedTextMessageData?.text ?? ''
    default:
      return null
  }
}

/** Преобразует уведомление GREEN-API в событие чата. Неинтересные уведомления → null. */
export function parseNotification(body: NotificationBody | null | undefined): ParsedNotification | null {
  if (!body) return null

  if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = body as StatusNotification
    const mapped = STATUS_MAP[status.status]
    if (!mapped) return null
    return {
      kind: 'status',
      chatId: String(status.chatId),
      idMessage: String(status.idMessage),
      status: mapped,
      error: mapped === 'failed' ? status.description || STATUS_ERRORS[status.status] : undefined,
    }
  }

  if (!MESSAGE_WEBHOOKS.has(body.typeWebhook)) return null

  const msg = body as MessageNotification
  if (!msg.senderData?.chatId || !msg.messageData) return null

  const text = extractText(msg.messageData)
  const incoming = msg.typeWebhook === 'incomingMessageReceived'
  const { senderData } = msg
  const phone = incoming && senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : undefined

  return {
    kind: 'message',
    chatId: String(senderData.chatId),
    phone,
    chatName: senderData.chatName || senderData.senderContactName || senderData.senderName || undefined,
    message: {
      id: String(msg.idMessage),
      text: text ?? `Сообщение типа «${msg.messageData.typeMessage}» не поддерживается`,
      unsupported: text === null ? true : undefined,
      timestamp: msg.timestamp * 1000,
      direction: incoming ? 'in' : 'out',
      status: incoming ? undefined : 'sent',
    },
  }
}
