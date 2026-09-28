import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/types'
import { normalizePhone } from '../lib/format'
import { parseNotification } from './notifications'
import { chatReducer, initialChatState } from './reducer'
import type { ChatState } from './types'

const incoming = (text: string, idMessage = 'in-1', chatId = '10000000'): NotificationBody => ({
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage,
  senderData: {
    chatId,
    chatName: 'Иван',
    chatType: 'user',
    sender: chatId,
    senderName: 'Иван',
    senderPhoneNumber: 79876543210,
  },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
})

function apply(state: ChatState, body: NotificationBody): ChatState {
  const notification = parseNotification(body)
  if (!notification) throw new Error('notification ignored')
  return chatReducer(state, { type: 'notificationReceived', notification, now: 0 })
}

describe('parseNotification', () => {
  it('разбирает входящее текстовое сообщение', () => {
    const parsed = parseNotification(incoming('Привет'))
    expect(parsed).toMatchObject({
      kind: 'message',
      chatId: '10000000',
      phone: '79876543210',
      chatName: 'Иван',
      message: { id: 'in-1', text: 'Привет', direction: 'in', timestamp: 1763115112000 },
    })
  })

  it('разбирает сообщение со ссылкой', () => {
    const body = incoming('')
    if ('messageData' in body) {
      body.messageData = {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'https://green-api.com' },
      }
    }
    const parsed = parseNotification(body)
    expect(parsed?.kind === 'message' && parsed.message.text).toBe('https://green-api.com')
  })

  it('помечает нетекстовые сообщения как неподдерживаемые', () => {
    const body = incoming('')
    if ('messageData' in body) body.messageData = { typeMessage: 'imageMessage' }
    const parsed = parseNotification(body)
    expect(parsed?.kind === 'message' && parsed.message.unsupported).toBe(true)
  })

  it('разбирает статус отправленного сообщения', () => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        chatId: '10000000',
        timestamp: 1,
        idMessage: 'out-1',
        status: 'noAccount',
      }),
    ).toEqual({
      kind: 'status',
      chatId: '10000000',
      idMessage: 'out-1',
      status: 'failed',
      error: 'У получателя нет аккаунта MAX',
    })
  })

  it('игнорирует служебные уведомления', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
    expect(parseNotification(null)).toBeNull()
  })
})

describe('chatReducer', () => {
  it('создаёт чат из входящего сообщения от нового собеседника', () => {
    const state = apply(initialChatState, incoming('Привет'))
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0]).toMatchObject({ id: '10000000', name: 'Иван', unread: 1 })
  })

  it('привязывает ответ к чату, созданному по номеру телефона', () => {
    let state = chatReducer(initialChatState, {
      type: 'chatOpened',
      chat: { id: '79876543210@c.us', phone: '79876543210', name: '+7 987 654-32-10' },
      now: 0,
    })
    state = apply(state, incoming('Ответ'))

    expect(state.chats).toHaveLength(1)
    expect(state.chats[0]).toMatchObject({ id: '10000000', name: 'Иван', unread: 0 })
    expect(state.activeChatId).toBe('10000000')
    expect(state.chats[0].messages.map((m) => m.text)).toEqual(['Ответ'])
  })

  it('проходит полный цикл отправки и не дублирует своё сообщение', () => {
    let state = chatReducer(initialChatState, {
      type: 'chatOpened',
      chat: { id: '10000000', phone: '79876543210', name: 'Иван' },
      now: 0,
    })
    state = chatReducer(state, { type: 'messageSending', chatId: '10000000', tempId: 't1', text: 'Hi', now: 1 })
    state = chatReducer(state, { type: 'messageSent', tempId: 't1', idMessage: 'out-1' })
    state = apply(state, {
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 2,
      idMessage: 'out-1',
      senderData: { chatId: '10000000' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Hi' } },
    })
    state = apply(state, {
      typeWebhook: 'outgoingMessageStatus',
      chatId: '10000000',
      timestamp: 3,
      idMessage: 'out-1',
      status: 'read',
    })
    // запоздавший статус не должен откатить «прочитано»
    state = apply(state, {
      typeWebhook: 'outgoingMessageStatus',
      chatId: '10000000',
      timestamp: 4,
      idMessage: 'out-1',
      status: 'delivered',
    })

    expect(state.chats[0].messages).toEqual([
      { id: 'out-1', text: 'Hi', timestamp: 1, direction: 'out', status: 'read' },
    ])
  })

  it('убирает временное сообщение, если уведомление пришло раньше ответа sendMessage', () => {
    let state = chatReducer(initialChatState, {
      type: 'chatOpened',
      chat: { id: '10000000', name: 'Иван' },
      now: 0,
    })
    state = chatReducer(state, { type: 'messageSending', chatId: '10000000', tempId: 't1', text: 'Hi', now: 1 })
    state = apply(state, {
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 2,
      idMessage: 'out-1',
      senderData: { chatId: '10000000' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Hi' } },
    })
    state = chatReducer(state, { type: 'messageSent', tempId: 't1', idMessage: 'out-1' })

    expect(state.chats[0].messages.map((m) => m.id)).toEqual(['out-1'])
  })

  it('отмечает сообщение как неотправленное при ошибке', () => {
    let state = chatReducer(initialChatState, {
      type: 'chatOpened',
      chat: { id: '10000000', name: 'Иван' },
      now: 0,
    })
    state = chatReducer(state, { type: 'messageSending', chatId: '10000000', tempId: 't1', text: 'Hi', now: 1 })
    state = chatReducer(state, { type: 'messageFailed', tempId: 't1', error: 'Ошибка' })
    expect(state.chats[0].messages[0]).toMatchObject({ status: 'failed', error: 'Ошибка' })
  })
})

describe('normalizePhone', () => {
  it('приводит номер к формату GREEN-API', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567')
    expect(normalizePhone('+375 29 123-45-67')).toBe('375291234567')
  })
})
