// Локальный мок GREEN-API для разработки без реального инстанса.
// Запуск: npm run mock → в форме входа укажите apiUrl http://localhost:3001,
// любой idInstance из цифр и любой apiTokenInstance.
// На каждое отправленное сообщение «собеседник» отвечает через пару секунд.
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 3001)
const queue = []
let receiptId = 1
let messageId = 1000

const phoneByChatId = new Map()

function chatIdByPhone(phone) {
  const chatId = String(Number(String(phone).slice(-8)) + 10_000_000)
  phoneByChatId.set(chatId, Number(phone))
  return chatId
}

// Как в MAX: сообщения можно слать и на `79991234567@c.us`, но ответы приходят с числовым chatId
const resolveChatId = (chatId) =>
  String(chatId).endsWith('@c.us') ? chatIdByPhone(String(chatId).replace('@c.us', '')) : String(chatId)

function push(body) {
  queue.push({ receiptId: receiptId++, body })
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(data === undefined ? '' : JSON.stringify(data))
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

const waiters = new Set()

function waitForNotification(timeoutMs) {
  if (queue.length) return Promise.resolve(queue[0])
  return new Promise((resolve) => {
    const waiter = () => {
      clearTimeout(timer)
      waiters.delete(waiter)
      resolve(queue[0] ?? null)
    }
    const timer = setTimeout(waiter, timeoutMs)
    waiters.add(waiter)
  })
}

function notify() {
  for (const waiter of [...waiters]) waiter()
}

function scheduleReply(chatId, text, sentId) {
  const phone = phoneByChatId.get(chatId) ?? 0
  setTimeout(() => {
    push({
      typeWebhook: 'outgoingMessageStatus',
      chatId,
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: sentId,
      status: 'read',
    })
    push({
      typeWebhook: 'incomingMessageReceived',
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: String(++messageId),
      senderData: {
        chatId,
        chatName: 'Тестовый собеседник',
        chatType: 'user',
        sender: chatId,
        senderName: 'Тестовый собеседник',
        senderPhoneNumber: phone,
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: `Получил: «${text}»` },
      },
    })
    notify()
  }, 2000)
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204)

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const match = url.pathname.match(/^\/(?:v3\/)?waInstance(\d+)\/(\w+)\/([^/]+)(?:\/(\d+))?$/)
  if (!match) return send(res, 404, { message: 'Not found' })
  const [, , method, token, param] = match
  if (token === 'bad') return send(res, 401)

  switch (method) {
    case 'getStateInstance':
      return send(res, 200, { stateInstance: 'authorized' })
    case 'getSettings':
      return send(res, 200, { wid: '79990000000@c.us', webhookUrl: '', incomingWebhook: 'yes', outgoingWebhook: 'yes' })
    case 'checkAccount': {
      const { phoneNumber } = await readJson(req)
      return send(res, 200, { exist: true, chatId: chatIdByPhone(phoneNumber), fromCache: false })
    }
    case 'sendMessage': {
      const body = await readJson(req)
      const chatId = resolveChatId(body.chatId)
      const { message } = body
      const id = String(++messageId)
      setTimeout(() => {
        push({
          typeWebhook: 'outgoingAPIMessageReceived',
          timestamp: Math.floor(Date.now() / 1000),
          idMessage: id,
          senderData: { chatId, chatType: 'user' },
          messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: message } },
        })
        push({
          typeWebhook: 'outgoingMessageStatus',
          chatId,
          timestamp: Math.floor(Date.now() / 1000),
          idMessage: id,
          status: 'delivered',
        })
        notify()
      }, 300)
      scheduleReply(chatId, message, id)
      return send(res, 200, { idMessage: id })
    }
    case 'receiveNotification': {
      const timeout = Math.min(Number(url.searchParams.get('receiveTimeout') ?? 5), 60) * 1000
      return send(res, 200, await waitForNotification(timeout))
    }
    case 'deleteNotification': {
      const index = queue.findIndex((n) => n.receiptId === Number(param))
      if (index >= 0) queue.splice(index, 1)
      return send(res, 200, { result: index >= 0 })
    }
    default:
      return send(res, 404, { message: `Метод ${method} не реализован в моке` })
  }
}).listen(PORT, () => console.log(`Mock GREEN-API: http://localhost:${PORT}`))
