import type { Credentials } from '../api/types'
import type { ChatState } from '../chat/types'

const CREDENTIALS_KEY = 'max-chat:credentials'
const chatsKey = (idInstance: string) => `max-chat:chats:${idInstance}`
const MAX_MESSAGES_PER_CHAT = 200

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // хранилище недоступно или переполнено — работаем без сохранения
  }
}

export const loadCredentials = () => read<Credentials>(CREDENTIALS_KEY)
export const saveCredentials = (creds: Credentials) => write(CREDENTIALS_KEY, creds)
export const clearCredentials = () => {
  try {
    localStorage.removeItem(CREDENTIALS_KEY)
  } catch {
    // ignore
  }
}

export function loadChats(idInstance: string): ChatState | null {
  const state = read<ChatState>(chatsKey(idInstance))
  return state && Array.isArray(state.chats) ? state : null
}

export function saveChats(idInstance: string, state: ChatState) {
  write(chatsKey(idInstance), {
    activeChatId: state.activeChatId,
    chats: state.chats.map((chat) => ({
      ...chat,
      // незавершённые отправки после перезагрузки уже не завершатся
      messages: chat.messages.slice(-MAX_MESSAGES_PER_CHAT).map((m) =>
        m.status === 'sending' ? { ...m, status: 'failed', error: 'Отправка прервана' } : m,
      ),
    })),
  })
}
