import { useCallback, useEffect, useReducer, useState } from 'react'
import { getSettings, sendMessage } from '../api/greenApi'
import type { Credentials, NotificationBody } from '../api/types'
import { parseNotification } from '../chat/notifications'
import { chatReducer, initialChatState } from '../chat/reducer'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import { formatPhone } from '../lib/format'
import { loadChats, saveChats } from '../lib/storage'
import { ChatView } from './ChatView'
import { NewChatDialog } from './NewChatDialog'
import { Sidebar } from './Sidebar'
import { AppLogo, ChatsIcon, CloseIcon, LogoutIcon } from './icons'

interface Props {
  creds: Credentials
  onLogout: () => void
}

let tempCounter = 0
const nextTempId = () => `local-${Date.now()}-${++tempCounter}`

export function Messenger({ creds, onLogout }: Props) {
  const [state, dispatch] = useReducer(
    chatReducer,
    creds.idInstance,
    (id) => loadChats(id) ?? initialChatState,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    saveChats(creds.idInstance, state)
  }, [creds.idInstance, state])

  // Предупреждаем, если настройки инстанса не позволят получать сообщения через HTTP API
  useEffect(() => {
    let cancelled = false
    getSettings(creds)
      .then((s) => {
        if (cancelled) return
        const list: string[] = []
        if (s.webhookUrl) {
          list.push('В настройках инстанса указан webhookUrl — очистите его, чтобы получать сообщения через HTTP API.')
        }
        if (s.incomingWebhook !== 'yes') {
          list.push('Включите в настройках инстанса «Получать уведомления о входящих сообщениях и файлах», иначе ответы не придут.')
        }
        setWarnings(list)
      })
      .catch(() => {
        // не критично: сообщения об ошибках покажет цикл получения уведомлений
      })
    return () => {
      cancelled = true
    }
  }, [creds])

  const handleNotification = useCallback((body: NotificationBody) => {
    const notification = parseNotification(body)
    if (notification) dispatch({ type: 'notificationReceived', notification, now: Date.now() })
  }, [])

  const polling = useNotificationPolling(creds, handleNotification)

  const activeChat = state.chats.find((c) => c.id === state.activeChatId) ?? null

  async function handleSend(text: string) {
    if (!activeChat) return
    const tempId = nextTempId()
    dispatch({ type: 'messageSending', chatId: activeChat.id, tempId, text, now: Date.now() })
    try {
      const { idMessage } = await sendMessage(creds, activeChat.id, text)
      dispatch({ type: 'messageSent', tempId, idMessage: String(idMessage) })
    } catch (e) {
      dispatch({
        type: 'messageFailed',
        tempId,
        error: e instanceof Error ? e.message : 'Не удалось отправить сообщение',
      })
    }
  }

  function handleCreateChat({ id, phone }: { id: string; phone: string }) {
    dispatch({ type: 'chatOpened', chat: { id, phone, name: formatPhone(phone) }, now: Date.now() })
    setDialogOpen(false)
  }

  return (
    <div className={`messenger${activeChat ? ' has-active-chat' : ''}`}>
      <nav className="rail">
        <button className="rail-item active" type="button" onClick={() => dispatch({ type: 'chatSelected', chatId: null })}>
          <ChatsIcon />
          <span>Все</span>
        </button>
        <div className="rail-spacer" />
        <button className="rail-item" type="button" onClick={onLogout} title={`Инстанс ${creds.idInstance}`}>
          <LogoutIcon />
          <span>Выйти</span>
        </button>
      </nav>

      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        connection={polling.status}
        onSelect={(chatId) => dispatch({ type: 'chatSelected', chatId })}
        onNewChat={() => setDialogOpen(true)}
        onLogout={onLogout}
      />

      <main className="main">
        {warnings.length > 0 && (
          <div className="banner" role="status">
            <ul>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <button className="icon-button" type="button" onClick={() => setWarnings([])} aria-label="Скрыть">
              <CloseIcon />
            </button>
          </div>
        )}
        {polling.status === 'error' && polling.error && (
          <div className="banner banner-error" role="alert">
            Ошибка получения сообщений: {polling.error}
          </div>
        )}

        {activeChat ? (
          <ChatView
            key={activeChat.id}
            chat={activeChat}
            onSend={handleSend}
            onBack={() => dispatch({ type: 'chatSelected', chatId: null })}
          />
        ) : (
          <div className="placeholder">
            <AppLogo className="placeholder-logo" />
            <p>Выберите чат или создайте новый</p>
            <button className="button-primary" type="button" onClick={() => setDialogOpen(true)}>
              Новый чат
            </button>
          </div>
        )}
      </main>

      {dialogOpen && (
        <NewChatDialog creds={creds} onCreate={handleCreateChat} onClose={() => setDialogOpen(false)} />
      )}
    </div>
  )
}
