import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createChatServer } from '../server/index.mjs'
import { createProcessor } from '../server/ai.mjs'
import { analyzeOffline, offlineTranslations, extractSummary } from '../shared/engine.mjs'

async function setup(t, processor = createProcessor({ enabled: false })) {
  const dir = mkdtempSync(join(tmpdir(), 'synapse-test-')), dataFile = join(dir, 'chat.json')
  let server = createChatServer({ dataFile, processor })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let base = `http://127.0.0.1:${server.address().port}`
  const api = async (path, data, cookie, method) => {
    const res = await fetch(`${base}/api${path}`, { method: method || (data === undefined ? 'GET' : 'POST'), headers: { ...(cookie ? { cookie } : {}), ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) })
    return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0], headers: res.headers }
  }
  const stop = async () => { server.closeStreams(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  t.after(async () => { await stop(); rmSync(dir, { recursive: true, force: true }) })
  const signup = async (name, country, lang) => api('/signup', { name, country, lang })
  return { api, signup, dataFile, get base() { return base }, async restart() { await stop(); server = createChatServer({ dataFile, processor }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}` } }
}
async function completed(api, cookie, id) {
  for (let n = 0; n < 50; n++) { const state = await api('/state', undefined, cookie); const m = state.body.messages.find(m => m.id === id); if (m?.translationStatus === 'done') return m; await new Promise(resolve => setTimeout(resolve, 10)) }
  throw new Error('Message processing did not finish')
}
test('country and language are independent; private and language rooms enforce membership', async t => {
  const { api, signup } = await setup(t)
  const a = await signup('지원', 'KR', 'en'), b = await signup('Haruto', 'JP', 'ja')
  assert.equal(a.status, 201); assert.equal(a.body.currentUser.flag, '🇰🇷')
  assert.deepEqual(a.body.rooms.map(r => r.id), ['global', 'language-en'])
  assert.match(a.headers.get('set-cookie'), /HttpOnly/)
  assert.equal((await api('/messages', { roomId: 'language-ja', text: 'hello' }, a.cookie)).status, 403)
  const room = await api('/rooms', { name: 'Private', memberIds: [] }, a.cookie)
  assert.equal((await api('/messages', { roomId: room.body.id, text: 'secret' }, b.cookie)).status, 403)
  assert.equal((await api('/summary', { roomId: room.body.id }, b.cookie)).status, 403)
  assert.ok(!(await api('/state', undefined, b.cookie)).body.rooms.some(r => r.id === room.body.id))
})
test('messages, cultural translations and sessions survive server restart; logout revokes access', async t => {
  const app = await setup(t), a = await app.signup('지원', 'KR', 'ko'), b = await app.signup('Emma', 'US', 'en')
  const sent = await app.api('/messages', { roomId: 'global', text: '오늘 발표 진짜 억까당함ㅋㅋㅋ' }, a.cookie)
  const done = await completed(app.api, b.cookie, sent.body.id)
  assert.equal(done.culturalAnalysis.expression, '억까'); assert.ok(done.translations.en.cultural.includes('lol'))
  assert.notEqual(done.translations.en.standard, done.translations.en.cultural)
  const file = readFileSync(app.dataFile, 'utf8'); assert.ok(!file.includes(a.cookie.split('=')[1]))
  await app.restart()
  assert.ok((await app.api('/state', undefined, b.cookie)).body.messages.some(m => m.id === done.id))
  assert.equal((await app.api('/logout', {}, a.cookie)).status, 200)
  assert.equal((await app.api('/state', undefined, a.cookie)).status, 401)
})
test('profile changes migrate language lounge and preserve private chats', async t => {
  const { api, signup } = await setup(t), a = await signup('A', 'KR', 'ko')
  const room = await api('/rooms', { name: 'Notes', memberIds: [] }, a.cookie)
  const updated = await api('/profile', { name: 'Renamed', country: 'KR', lang: 'ja' }, a.cookie, 'PATCH')
  assert.equal(updated.body.currentUser.flag, '🇰🇷'); assert.ok(updated.body.rooms.some(r => r.id === 'language-ja'))
  assert.ok(!updated.body.rooms.some(r => r.id === 'language-ko')); assert.ok(updated.body.rooms.some(r => r.id === room.body.id))
})
test('SSE delivers new messages to a different user without polling', { timeout: 5000 }, async t => {
  const app = await setup(t), a = await app.signup('A', 'KR', 'ko'), b = await app.signup('B', 'US', 'en')
  const abort = new AbortController()
  t.after(() => abort.abort())
  const stream = await fetch(`${app.base}/api/events`, { headers: { cookie: b.cookie }, signal: abort.signal })
  const reader = stream.body.getReader(), decoder = new TextDecoder(); await reader.read()
  const sent = await app.api('/messages', { roomId: 'global', text: '안녕하세요' }, a.cookie)
  let result = ''
  while (!result.includes(sent.body.id)) { const chunk = await reader.read(); result += decoder.decode(chunk.value) }
  assert.ok(result.includes('안녕하세요')); abort.abort()
})
test('input validation, missing session and cross-origin requests are rejected', async t => {
  const app = await setup(t)
  assert.equal((await app.api('/state')).status, 401)
  for (const input of [null, [], { name: '', country: 'KR', lang: 'ko' }, { name: 'A', country: '__proto__', lang: 'ko' }, { name: 'A', country: 'KR', lang: 'invalid' }]) assert.equal((await app.api('/signup', input)).status, 400)
  const a = await app.signup('A', 'KR', 'ko')
  assert.equal((await app.api('/messages', { roomId: 'global', text: ' '.repeat(2) }, a.cookie)).status, 400)
  assert.equal((await app.api('/messages', { roomId: 'global', text: 'a'.repeat(4001) }, a.cookie)).status, 400)
  assert.equal((await app.api('/rooms', { name: 'Bad', memberIds: ['__proto__'] }, a.cookie)).status, 400)
  const cross = await fetch(`${app.base}/api/messages`, { method: 'POST', headers: { Origin: 'https://evil.example', cookie: a.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId: 'global', text: 'x' }) })
  assert.equal(cross.status, 403)
})
test('offline summary uses actual room messages and never invents decisions', async t => {
  const { api, signup } = await setup(t), a = await signup('A', 'KR', 'ko')
  assert.equal((await api('/summary', { roomId: 'global' }, a.cookie)).body, null)
  await api('/messages', { roomId: 'global', text: '수요일 오전 10시에 디자인 회의를 제안합니다.' }, a.cookie)
  const summary = (await api('/summary', { roomId: 'global' }, a.cookie)).body
  assert.ok(summary.points[0].includes('수요일 오전 10시')); assert.deepEqual(summary.decisions, []); assert.equal(summary.mode, 'extractive')
})
test('unknown phrases remain untranslated; culturally neutral text gets no false detection', () => {
  assert.deepEqual(offlineTranslations('임의 문장 42', 'ko'), {})
  assert.equal(analyzeOffline('회의는 내일입니다.', 'ko'), null)
  assert.equal(analyzeOffline('Please break a leg!', 'en').localized.ja.category, '慣用句')
  assert.equal(analyzeOffline('뭐하노?', 'ko').category, '지역 표현')
  assert.equal(extractSummary([], 'en'), null)
})
test('AI failures finalize delivery and summaries show an error instead of fabricated output', async t => {
  const processor = createProcessor({ enabled: true, generate: async () => { throw new Error('provider unavailable') } })
  const { api, signup } = await setup(t, processor), a = await signup('A', 'KR', 'ko')
  const message = await api('/messages', { roomId: 'global', text: '처음 보는 문장' }, a.cookie)
  const result = await completed(api, a.cookie, message.body.id)
  assert.equal(result.processingError, 'unavailable'); assert.deepEqual(result.translations, {})
  assert.equal((await api('/summary', { roomId: 'global' }, a.cookie)).status, 503)
})
test('AI translation and summary processor uses structured output and real context', async () => {
  const calls = []
  const processor = createProcessor({ enabled: true, generate: async (instructions, input, schema, name) => {
    calls.push({ instructions, input, schema, name })
    if (name === 'chat_summary') return { points: ['Design review proposed for Wednesday.'], decisions: [] }
    return { translations: ['en', 'ja', 'zh-TW'].map(language => ({ language, standard: `translated-${language}`, cultural: `context-${language}`, nuance: '', meaningKo: { standard: '번역', cultural: '맥락' } })), cultures: ['ko', 'en', 'ja', 'zh-TW'].map(language => ({ language, analysis: null })) }
  } })
  const result = await processor.process('새 문장', 'ko', [{ originalText: '문맥', originalLanguage: 'ko' }])
  assert.equal(result.translations.en.standard, 'translated-en'); assert.equal(calls[0].input.context[0].text, '문맥'); assert.equal(calls[0].schema.additionalProperties, false)
  const summary = await processor.summarize([{ senderId: 'a', originalText: 'Design review on Wednesday?', originalLanguage: 'en', createdAt: '2026-10-07' }], 'en', { a: { name: 'A' } })
  assert.equal(summary.mode, 'ai'); assert.equal(calls[1].input[0].speaker, 'A')
})
