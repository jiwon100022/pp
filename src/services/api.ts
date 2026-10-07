import type { Message, Room, User } from '../types'
export type Snapshot = { currentUser: User; users: Record<string, User>; rooms: Room[]; messages: Message[]; aiEnabled: boolean }
let server = false
const configured = import.meta.env.VITE_API_URL as string | undefined
export const apiBase = configured ? configured.replace(/\/$/, '') + '/api' : import.meta.env.DEV ? '/api' : `${import.meta.env.BASE_URL}api`
export const isServer = () => server
export async function request<T>(path: string, data?: unknown, method = data === undefined ? 'GET' : 'POST'): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { method, credentials: 'include', headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(60000) })
  const payload = await response.json()
  if (!response.ok) throw Object.assign(new Error(payload.error || 'Request failed'), { status: response.status })
  return payload as T
}
export async function detectServer() {
  try {
    const response = await fetch(`${apiBase}/health`, { credentials: 'include', signal: AbortSignal.timeout(3500) })
    const data = await response.json()
    server = response.ok && data.mode === 'server'
    if (!server && configured) throw new Error('Configured server unavailable')
  } catch (error) { if (configured) throw error; server = false }
  return server
}
