export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'starting'
  | 'suspended'
  | 'pendingPassword'

export interface InstanceSettings {
  wid: string
  webhookUrl: string
  incomingWebhook: 'yes' | 'no'
  outgoingWebhook: 'yes' | 'no'
  outgoingMessageWebhook: 'yes' | 'no'
  outgoingAPIMessageWebhook: 'yes' | 'no'
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: 'user' | 'group'
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
  quotedMessage?: unknown
}

export type OutgoingStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'noAccount'
  | 'notInGroup'

export interface MessageNotification {
  typeWebhook:
    | 'incomingMessageReceived'
    | 'outgoingMessageReceived'
    | 'outgoingAPIMessageReceived'
  timestamp: number
  idMessage: string
  senderData: SenderData
  messageData: MessageData
}

export interface StatusNotification {
  typeWebhook: 'outgoingMessageStatus'
  chatId: string
  timestamp: number
  idMessage: string
  status: OutgoingStatus
  description?: string
}

export interface OtherNotification {
  typeWebhook: string
  timestamp?: number
}

export type NotificationBody =
  | MessageNotification
  | StatusNotification
  | OtherNotification

export interface ReceivedNotification {
  receiptId: number
  body: NotificationBody
}
