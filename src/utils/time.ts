export function formatTime(iso: string, lang = 'ko') {
  return new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

