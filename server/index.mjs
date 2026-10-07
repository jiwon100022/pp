import http from 'node:http'
import { randomUUID, randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { countries, languages, publicRooms, analyzeOffline } from '../shared/engine.mjs'
import { createProcessor } from './ai.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hash = token => createHash('sha256').update(token).digest('hex')
const fail = (status, message) => Object.assign(new Error(message), { status })
export function createChatServer({ dataFile = resolve(root, 'data/chat.json'), processor = createProcessor(), allowedOrigin = process.env.ALLOWED_ORIGIN, secureCookie = process.env.COOKIE_SECURE === 'true' } = {}) {
  const db = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : { users: {}, sessions: {}, rooms: publicRooms(), messages: [] }
  // Work interrupted by a previous process must not remain pending forever.
  for (const message of db.messages) if (message.translationStatus === 'pending') Object.assign(message, { translationStatus: 'done', processingError: 'interrupted' })
  const clients = new Map(), limits = new Map()
  const persist = () => { mkdirSync(dirname(dataFile), { recursive: true }); writeFileSync(`${dataFile}.tmp`, JSON.stringify(db), { mode: 0o600 }); renameSync(`${dataFile}.tmp`, dataFile) }
  const snapshot = userId => {
    const rooms = db.rooms.filter(r => r.memberIds.includes(userId))
    const ids = new Set(rooms.map(r => r.id))
    return { currentUser: db.users[userId], users: db.users, rooms, messages: db.messages.filter(m => ids.has(m.roomId)), aiEnabled: processor.enabled }
  }
  const broadcast = () => { for (const [res, userId] of clients) res.write(`data: ${JSON.stringify(snapshot(userId))}\n\n`) }
  const limit = (key, max, window = 60000) => {
    const now = Date.now(), previous = limits.get(key)
    const entry = !previous || now - previous.at >= window ? { at: now, count: 0 } : previous
    if (++entry.count > max) throw fail(429, 'Too many requests. Please try again later.')
    limits.set(key, entry)
    if (limits.size > 10000) for (const [k, v] of limits) if (now - v.at > 3600000) limits.delete(k)
  }
  const identity = req => {
    const token = /(?:^|;\s*)synapse_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1]
    const session = token && db.sessions[hash(token)]
    if (!session || session.expiresAt < Date.now()) throw fail(401, 'Please sign up or sign in again.')
    return { userId: session.userId, token }
  }
  const body = async req => {
    if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'JSON required')
    let text = ''
    for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 20000) throw fail(413, 'Request too large') }
    try { const parsed = JSON.parse(text); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed } catch { throw fail(400, 'Invalid JSON object') }
  }
  const profile = input => {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 30 || !Object.hasOwn(countries, input.country) || !languages.includes(input.lang)) throw fail(400, 'Name (1–30 characters), country and supported language are required.')
    return { name: input.name.trim(), country: input.country, lang: input.lang, flag: countries[input.country][0], color: '#1a9e57' }
  }
  const enroll = user => { for (const r of db.rooms) { if (r.kind === 'global' || r.kind === 'language') { r.memberIds = r.memberIds.filter(id => id !== user.id); if (r.kind === 'global' || r.language === user.lang) r.memberIds.push(user.id) } } }
  const roomFor = (id, userId) => { const room = db.rooms.find(r => r.id === id && r.memberIds.includes(userId)); if (!room) throw fail(403, 'Room access denied'); return room }
  const cookie = (value, maxAge = 2592000) => `synapse_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`
  let activeJobs = 0
  const queue = []
  const drain = () => { while (queue.length && activeJobs < 3) { activeJobs++; queue.shift()().finally(() => { activeJobs--; drain() }) } }
  const processMessage = message => {
    if (queue.length >= 100) { Object.assign(message, { translationStatus: 'done', processingError: 'busy' }); persist(); broadcast(); return }
    queue.push(async () => {
      try { Object.assign(message, await processor.process(message.originalText, message.originalLanguage, db.messages.filter(m => m.roomId === message.roomId && m.createdAt < message.createdAt))) }
      catch { message.processingError = 'unavailable'; message.culturalAnalysis = analyzeOffline(message.originalText, message.originalLanguage) }
      message.translationStatus = 'done'; persist(); broadcast()
    }); drain()
  }
  const server = http.createServer(async (req, res) => {
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const origin = req.headers.origin
      const ownOrigin = `${secureCookie ? 'https' : 'http'}://${req.headers.host}`
      if (origin && origin !== ownOrigin && origin !== allowedOrigin) throw fail(403, 'Origin not allowed')
      if (origin && origin === allowedOrigin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Vary', 'Origin') }
      res.setHeader('X-Content-Type-Options', 'nosniff')
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end() }
      if (url.pathname === '/api/health' && req.method === 'GET') return json(200, { mode: 'server', aiEnabled: processor.enabled })
      if (url.pathname === '/api/signup' && req.method === 'POST') {
        limit(`signup:${req.socket.remoteAddress}`, 30, 3600000)
        const user = { id: randomUUID(), ...profile(await body(req)) }, token = randomBytes(32).toString('hex')
        db.users[user.id] = user
        for (const [key, session] of Object.entries(db.sessions)) if (session.expiresAt < Date.now()) delete db.sessions[key]
        db.sessions[hash(token)] = { userId: user.id, expiresAt: Date.now() + 2592000000 }
        enroll(user); persist(); res.setHeader('Set-Cookie', cookie(token)); broadcast(); return json(201, snapshot(user.id))
      }
      if (url.pathname.startsWith('/api/')) {
        const { userId, token } = identity(req)
        if (url.pathname === '/api/state' && req.method === 'GET') return json(200, snapshot(userId))
        if (url.pathname === '/api/events' && req.method === 'GET') {
          if ([...clients.values()].filter(id => id === userId).length >= 5) throw fail(429, 'Too many connections')
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
          res.write(`data: ${JSON.stringify(snapshot(userId))}\n\n`); clients.set(res, userId)
          const timer = setInterval(() => { if (!db.sessions[hash(token)] || db.sessions[hash(token)].expiresAt < Date.now()) res.end(); else res.write(': heartbeat\n\n') }, 20000)
          res.on('close', () => { clearInterval(timer); clients.delete(res) }); return
        }
        if (url.pathname === '/api/profile' && req.method === 'PATCH') { limit(userId, 60); Object.assign(db.users[userId], profile(await body(req))); enroll(db.users[userId]); persist(); broadcast(); return json(200, snapshot(userId)) }
        if (url.pathname === '/api/logout' && req.method === 'POST') { delete db.sessions[hash(token)]; persist(); for (const [client, id] of clients) if (id === userId) client.end(); res.setHeader('Set-Cookie', cookie('', 0)); return json(200, { ok: true }) }
        if (url.pathname === '/api/rooms' && req.method === 'POST') {
          limit(userId, 20); const input = await body(req)
          if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 60 || !Array.isArray(input.memberIds) || input.memberIds.length > 30 || input.memberIds.some(id => typeof id !== 'string' || !Object.hasOwn(db.users, id))) throw fail(400, 'Valid room name and members required')
          const room = { id: randomUUID(), kind: 'private', name: input.name.trim(), memberIds: [...new Set([userId, ...input.memberIds])], unread: 0 }
          db.rooms.push(room); persist(); broadcast(); return json(201, room)
        }
        if (url.pathname === '/api/messages' && req.method === 'POST') {
          limit(userId, 60); const input = await body(req); roomFor(input.roomId, userId)
          if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 4000) throw fail(400, 'Message must contain 1–4000 characters')
          const message = { id: randomUUID(), roomId: input.roomId, senderId: userId, originalText: input.text.trim(), originalLanguage: db.users[userId].lang, translations: {}, culturalAnalysis: null, translationStatus: 'pending', createdAt: new Date().toISOString() }
          db.messages.push(message); persist(); broadcast(); json(201, message); processMessage(message); return
        }
        if (url.pathname === '/api/culture' && req.method === 'POST') {
          limit(`culture:${userId}`, 90); const input = await body(req)
          if (typeof input.text !== 'string' || input.text.length > 4000 || !languages.includes(input.lang)) throw fail(400, 'Invalid text or language')
          // Drafts stay on device in normal use; inexpensive offline hints avoid AI calls per keystroke.
          return json(200, analyzeOffline(input.text, input.lang))
        }
        if (url.pathname === '/api/summary' && req.method === 'POST') {
          limit(`summary:${userId}`, 6); const input = await body(req); roomFor(input.roomId, userId)
          return json(200, await processor.summarize(db.messages.filter(m => m.roomId === input.roomId), db.users[userId].lang, db.users))
        }
        throw fail(404, 'Endpoint not found')
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw fail(405, 'Method not allowed')
      const dist = resolve(root, 'dist'), path = resolve(dist, '.' + decodeURIComponent(url.pathname))
      if (path !== dist && !path.startsWith(dist + sep)) throw fail(403, 'Forbidden')
      const file = existsSync(path) && statSync(path).isFile() ? path : resolve(dist, 'index.html')
      if (!existsSync(file)) throw fail(503, 'Build the app first: npm run build')
      res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' })
      res.end(req.method === 'HEAD' ? undefined : readFileSync(file))
    } catch (error) { if (!res.headersSent) json(error.status || 503, { error: error.status ? error.message : 'Service temporarily unavailable. Please try again.' }); else res.end() }
  })
  server.on('close', () => { for (const res of clients.keys()) res.end() })
  server.closeStreams = () => { for (const res of clients.keys()) res.end() }
  return server
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createChatServer()
  server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log(`Synapse: http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 8787} | AI ${process.env.OPENAI_API_KEY ? 'enabled' : 'offline'}`))
}
