import { formatPhone } from '../lib/format'
import type { ParsedNotification } from './notifications'
import type { Chat, ChatState, Message, MessageStatus } from './types'

export type ChatAction =
  | { type: 'chatOpened'; chat: Pick<Chat, 'id' | 'name' | 'phone'>; now: number }
  | { type: 'chatSelected'; chatId: string | null }
  | { type: 'messageSending'; chatId: string; tempId: string; text: string; now: number }
  | { type: 'messageSent'; tempId: string; idMessage: string }
  | { type: 'messageFailed'; tempId: string; error: string }
  | { type: 'notificationReceived'; notification: ParsedNotification; now: number }

export const initialChatState: ChatState = { chats: [], activeChatId: null }

const STATUS_RANK: Record<MessageStatus, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
}

function updateChat(state: ChatState, chatId: string, update: (chat: Chat) => Chat): ChatState {
  return {
    ...state,
    chats: state.chats.map((chat) => (chat.id === chatId ? update(chat) : chat)),
  }
}

function updateMessage(chat: Chat, messageId: string, update: (m: Message) => Message): Chat {
  return {
    ...chat,
    messages: chat.messages.map((m) => (m.id === messageId ? update(m) : m)),
  }
}

/** Вставка с сохранением порядка по времени (новые сообщения почти всегда в конце). */
function insertMessage(messages: Message[], message: Message): Message[] {
  let index = messages.length
  while (index > 0 && messages[index - 1].timestamp > message.timestamp) index--
  return [...messages.slice(0, index), message, ...messages.slice(index)]
}

/** Ищет чат по chatId, а если его нет — по номеру телефона (чат мог быть создан по номеру). */
function findChat(chats: Chat[], chatId: string, phone?: string): Chat | undefined {
  return (
    chats.find((c) => c.id === chatId) ??
    (phone ? chats.find((c) => c.phone === phone) : undefined)
  )
}

/** Чат, в котором лежит сообщение (id чата мог смениться, пока сообщение отправлялось). */
function chatIdOfMessage(state: ChatState, messageId: string): string | undefined {
  return state.chats.find((c) => c.messages.some((m) => m.id === messageId))?.id
}

function applyNotification(state: ChatState, n: ParsedNotification, now: number): ChatState {
  if (n.kind === 'status') {
    const chatId = chatIdOfMessage(state, n.idMessage)
    if (!chatId) return state
    return updateChat(state, chatId, (c) =>
      updateMessage(c, n.idMessage, (m) =>
        m.status && STATUS_RANK[n.status] <= STATUS_RANK[m.status]
          ? m
          : { ...m, status: n.status, error: n.error },
      ),
    )
  }

  const existing = findChat(state.chats, n.chatId, n.phone)

  if (!existing) {
    const chat: Chat = {
      id: n.chatId,
      phone: n.phone,
      name: n.chatName || n.phone || n.chatId,
      createdAt: now,
      unread: n.message.direction === 'in' ? 1 : 0,
      messages: [n.message],
    }
    return { ...state, chats: [chat, ...state.chats] }
  }

  // Сообщение уже есть (например, своё отправленное через API) — не дублируем
  if (existing.messages.some((m) => m.id === n.message.id)) return state

  const isActive = state.activeChatId === existing.id
  // Чату, созданному по номеру, даём имя собеседника из MAX
  const nameIsPlaceholder =
    existing.name === existing.id ||
    (existing.phone !== undefined && [existing.phone, formatPhone(existing.phone)].includes(existing.name))

  const next: ChatState = updateChat(state, existing.id, (chat) => ({
    ...chat,
    // Чат, созданный по номеру, получает настоящий chatId MAX из первого ответа
    id: n.chatId,
    phone: chat.phone ?? n.phone,
    name: nameIsPlaceholder && n.message.direction === 'in' && n.chatName ? n.chatName : chat.name,
    unread: chat.unread + (n.message.direction === 'in' && !isActive ? 1 : 0),
    messages: insertMessage(chat.messages, n.message),
  }))

  return isActive && existing.id !== n.chatId ? { ...next, activeChatId: n.chatId } : next
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened': {
      const existing = findChat(state.chats, action.chat.id, action.chat.phone)
      if (existing) return { ...state, activeChatId: existing.id }
      const chat: Chat = { ...action.chat, createdAt: action.now, unread: 0, messages: [] }
      return { chats: [chat, ...state.chats], activeChatId: chat.id }
    }

    case 'chatSelected': {
      const next = { ...state, activeChatId: action.chatId }
      return action.chatId ? updateChat(next, action.chatId, (c) => ({ ...c, unread: 0 })) : next
    }

    case 'messageSending':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: insertMessage(chat.messages, {
          id: action.tempId,
          text: action.text,
          timestamp: action.now,
          direction: 'out',
          status: 'sending',
        }),
      }))

    case 'messageSent': {
      const chatId = chatIdOfMessage(state, action.tempId)
      if (!chatId) return state
      return updateChat(state, chatId, (chat) => {
        // Уведомление outgoingAPIMessageReceived могло прийти раньше ответа sendMessage
        if (chat.messages.some((m) => m.id === action.idMessage)) {
          return { ...chat, messages: chat.messages.filter((m) => m.id !== action.tempId) }
        }
        return updateMessage(chat, action.tempId, (m) => ({
          ...m,
          id: action.idMessage,
          status: 'sent',
        }))
      })
    }

    case 'messageFailed': {
      const chatId = chatIdOfMessage(state, action.tempId)
      if (!chatId) return state
      return updateChat(state, chatId, (chat) =>
        updateMessage(chat, action.tempId, (m) => ({ ...m, status: 'failed', error: action.error })),
      )
    }

    case 'notificationReceived':
      return applyNotification(state, action.notification, action.now)
  }
}
