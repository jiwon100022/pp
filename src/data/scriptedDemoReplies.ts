/**
 * 시연용 자동 답장 스크립트.
 * 특정 문장을 보내면 준비된 상대 메시지가 일반 수신 메시지처럼 이어진다.
 * 시연이 끝나면 이 파일과 App.tsx의 호출부만 삭제하면 된다.
 */
import { normalizeText } from '../utils/text'

export type ScriptedReply = {
  senderId: string
  text: string
  /** 이전 메시지(또는 트리거 메시지) 이후 지연 시간 */
  delayMs: number
}

type Script = {
  roomId: string
  senderId: string
  trigger: string
  replies: ScriptedReply[]
}

const SCRIPTS: Script[] = [
  {
    roomId: 'global',
    senderId: 'jiwon',
    trigger: '오늘 발표 진짜 억까당함ㅋㅋㅋ',
    replies: [
      { senderId: 'haruto', text: 'それは大変だったね。何があったの？', delayMs: 900 },
      { senderId: 'emma', text: 'That sounds rough. Are you okay?', delayMs: 1200 },
    ],
  },
]

export function getScriptedReplies(roomId: string, senderId: string, text: string) {
  const key = normalizeText(text)
  return (
    SCRIPTS.find(
      (s) => s.roomId === roomId && s.senderId === senderId && normalizeText(s.trigger) === key,
    )?.replies ?? []
  )
}

