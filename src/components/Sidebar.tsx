import { useMemo, useState } from 'react'
import type { Chat } from '../chat/types'
import type { PollingStatus } from '../hooks/useNotificationPolling'
import { formatChatListTime } from '../lib/format'
import { Avatar } from './Avatar'
import { MessageStatusIcon } from './MessageStatusIcon'
import { LogoutIcon, PlusIcon, SearchIcon } from './icons'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  connection: PollingStatus
  onSelect: (chatId: string) => void
  onNewChat: () => void
  onLogout: () => void
}

const lastActivity = (chat: Chat) => chat.messages.at(-1)?.timestamp ?? chat.createdAt

export function Sidebar({ chats, activeChatId, connection, onSelect, onNewChat, onLogout }: Props) {
  const [query, setQuery] = useState('')

  const visibleChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    const matches = (c: Chat) =>
      !q || c.name.toLowerCase().includes(q) || (digits !== '' && Boolean(c.phone?.includes(digits)))
    return chats
      .filter(matches)
      .sort((a, b) => lastActivity(b) - lastActivity(a))
  }, [chats, query])

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div>
          <h1 className="sidebar-title">Чаты</h1>
          {connection === 'error' && <div className="connection">Нет соединения, переподключаемся…</div>}
        </div>
        <div className="sidebar-actions">
          <button className="icon-button mobile-only" type="button" onClick={onLogout} aria-label="Выйти">
            <LogoutIcon />
          </button>
          <button className="fab" type="button" onClick={onNewChat} title="Новый чат" aria-label="Новый чат">
            <PlusIcon />
          </button>
        </div>
      </header>

      <label className="search">
        <SearchIcon className="search-icon" />
        <input
          className="search-input"
          placeholder="Найти"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {chats.length === 0 ? (
        <div className="sidebar-empty">
          <p>Здесь появятся ваши чаты</p>
          <button className="button-link" type="button" onClick={onNewChat}>
            Начать новый чат
          </button>
        </div>
      ) : (
        <ul className="chat-list">
          {visibleChats.map((chat) => (
            <li key={chat.id}>
              <ChatListItem chat={chat} active={chat.id === activeChatId} onClick={() => onSelect(chat.id)} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function ChatListItem({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  const last = chat.messages.at(-1)
  return (
    <button type="button" className={`chat-item${active ? ' active' : ''}`} onClick={onClick}>
      <Avatar name={chat.name} seed={chat.phone ?? chat.id} />
      <div className="chat-item-body">
        <div className="chat-item-top">
          <span className="chat-item-name">{chat.name}</span>
          <span className="chat-item-meta">
            {last?.direction === 'out' && last.status && (
              <MessageStatusIcon status={last.status} error={last.error} />
            )}
            <time>{formatChatListTime(lastActivity(chat))}</time>
          </span>
        </div>
        <div className="chat-item-bottom">
          <span className="chat-item-preview">
            {last ? (
              <>
                {last.direction === 'out' && <span className="preview-you">Вы: </span>}
                {last.text}
              </>
            ) : (
              <span className="preview-empty">Нет сообщений</span>
            )}
          </span>
          {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
        </div>
      </div>
    </button>
  )
}
