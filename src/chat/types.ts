export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  text: string
  /** Время в миллисекундах */
  timestamp: number
  direction: 'in' | 'out'
  status?: MessageStatus
  error?: string
  /** Сообщение не текстовое — показываем заглушку */
  unsupported?: boolean
}

export interface Chat {
  /** chatId в MAX: числовой идентификатор или `79991234567@c.us` */
  id: string
  phone?: string
  name: string
  createdAt: number
  unread: number
  messages: Message[]
}

export interface ChatState {
  chats: Chat[]
  activeChatId: string | null
}
