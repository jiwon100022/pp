export function formatTime(iso: string) {
  const date = new Date(iso)
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`
}

