export const languages = ['ko', 'en', 'ja', 'zh-TW']
export const countries = {
  KR: ['🇰🇷', 'ko'], US: ['🇺🇸', 'en'], GB: ['🇬🇧', 'en'], CA: ['🇨🇦', 'en'],
  AU: ['🇦🇺', 'en'], JP: ['🇯🇵', 'ja'], TW: ['🇹🇼', 'zh-TW'], CN: ['🇨🇳', 'zh-TW'], OTHER: ['🌍', 'en'],
}
export const publicRooms = () => [
  { id: 'global', name: 'Global Lounge', kind: 'global', memberIds: [], unread: 0 },
  ...languages.map(language => ({ id: `language-${language}`, name: ({ ko: '한국어 라운지', en: 'English Lounge', ja: '日本語ラウンジ', 'zh-TW': '繁體中文聊天室' })[language], language, kind: 'language', memberIds: [], unread: 0 })),
]

const phrases = [
  ['안녕하세요', 'Hello', 'こんにちは', '你好'],
  ['고마워!', 'Thanks!', 'ありがとう！', '謝謝！'],
  ['내일 봐요', 'See you tomorrow', 'また明日', '明天見'],
  ['오늘 발표 진짜 억까당함ㅋㅋㅋ', 'I got unfairly criticized during my presentation today, lol.', '今日の発表、理不尽に批判されたよ（笑）。', '今天的報告被莫名其妙地批評了，哈哈。'],
  ['뭐하노 아직도 안 왔나', "What are you up to? Aren’t you here yet?", '何してるの？まだ来てないの？', '你在做什麼？還沒到嗎？'],
  ['이번에는 진짜 발등에 불 떨어졌어', 'This time I really need to act fast.', '今回は本当に急いで対応しないと。', '這次真的得馬上處理了。'],
  ['수고하셨습니다', 'Thank you for your hard work.', 'お疲れ様です', '辛苦了'],
  ['행운을 빌어요', 'Break a leg!', '頑張ってね！', '祝你順利！'],
  ['완전 식은 죽 먹기야', "It's a piece of cake", '朝飯前だよ', '小菜一碟'],
]
const normalize = text => text.trim().toLowerCase().replace(/[.!！。?？\s]/g, '')
export function offlineTranslations(text, from, targets = languages) {
  const order = ['ko', 'en', 'ja', 'zh-TW']
  const row = phrases.find(p => normalize(p[order.indexOf(from)]) === normalize(text))
  if (!row) return {}
  const standard = ({
    '오늘 발표 진짜 억까당함ㅋㅋㅋ': ['오늘 발표에서 부당한 비판을 받았어.', 'I received unfair criticism during my presentation today.', '今日の発表で理不尽な批判を受けた。', '今天報告時受到了不公平的批評。'],
    '이번에는 진짜 발등에 불 떨어졌어': ['이번에는 상황이 매우 급해졌어.', 'The situation has become very urgent this time.', '今回は状況がとても切迫している。', '這次情況變得非常緊急。'],
    '뭐하노 아직도 안 왔나': ['뭐 하고 있어? 아직 안 왔어?', 'What are you doing? Have you not arrived yet?', '何をしているの？まだ到着していないの？', '你在做什麼？還沒抵達嗎？'],
  })[row[0]] || row
  return Object.fromEntries(targets.filter(l => l !== from).map(lang => [lang, { standard: standard[order.indexOf(lang)], cultural: row[order.indexOf(lang)], meaningKo: { standard: standard[0], cultural: row[0] } }]))
}
const rules = [
  ['ko', /억까/, '억까', 'slang', ['부당한 비판이나 억울한 상황을 나타내는 인터넷 줄임말', 'Internet slang for unfair criticism', '理不尽な批判を表すネットスラング', '表示不公平批評的網路用語']],
  ['ko', /뭐하노/, '뭐하노', 'dialect', ['경상도에서 쓰는 “뭐 하고 있어?”라는 표현', 'Gyeongsang dialect for “What are you doing?”', '慶尚道の方言で「何してるの？」', '慶尚道方言，意思是「你在做什麼？」']],
  ['ko', /발등에 불/, '발등에 불이 떨어지다', 'idiom', ['당장 대응해야 할 만큼 급한 상황을 뜻하는 관용어', 'An idiom for an urgent situation requiring immediate action', 'すぐ対応が必要な状況を表す慣用句', '表示情況緊急、必須立刻行動的慣用語']],
  ['ko', /수고하셨|수고했/, '수고하셨습니다', 'politeness', ['상대의 노력에 감사를 표현하는 인사. 관계에 따라 적절한 높임말이 달라집니다.', 'Acknowledges someone’s effort; formality depends on the relationship.', '相手の努力をねぎらう挨拶。関係によって敬語が変わります。', '肯定對方付出的問候語，禮貌程度依關係而定。']],
  ['ko', /ㅋ{2,}/, 'ㅋㅋ', 'slang', ['웃음을 나타내는 채팅 표현. 문맥에 따라 가벼운 웃음이나 어색함을 나타냅니다.', 'Chat laughter; context can indicate amusement or awkwardness.', 'チャットの笑い。文脈により楽しさや気まずさを表します。', '聊天中的笑聲，依上下文表示好笑或尷尬。']],
  ['en', /break a leg/i, 'Break a leg', 'idiom', ['공연·발표 전에 행운을 비는 표현', 'A wish for good luck before a performance', '公演や発表前に成功を祈る表現', '表演或報告前祝福順利的說法']],
  ['en', /piece of cake/i, 'piece of cake', 'idiom', ['매우 쉬운 일을 뜻하는 관용어', 'An idiom meaning very easy', 'とても簡単という慣用句', '表示非常簡單的慣用語']],
  ['en', /\blol\b/i, 'lol', 'slang', ['온라인 웃음 표현. 가벼운 말투를 나타내기도 합니다.', 'Online laughter, sometimes softening the tone.', 'ネット上の笑いで、口調を和らげることもあります。', '網路笑聲，也可能讓語氣更輕鬆。']],
  ['ja', /お疲れ/, 'お疲れ様です', 'politeness', ['함께 일한 상대를 격려하고 노고를 인정하는 인사', 'A greeting acknowledging a colleague’s effort', '相手の労をねぎらう挨拶', '慰勞同事、肯定付出的問候']],
  ['zh-TW', /辛苦了/, '辛苦了', 'politeness', ['상대가 들인 노력에 감사하는 표현', 'An expression appreciating someone’s effort', '相手の努力に感謝する表現', '感謝對方付出的表達']],
]
export function analyzeOffline(text, from) {
  const rule = rules.find(([lang, pattern]) => lang === from && pattern.test(text))
  if (!rule) return null
  const [, , expression, category, meanings] = rule
  const labels = { slang: ['유행어·인터넷 표현', 'Slang', 'スラング', '網路用語'], dialect: ['지역 표현', 'Dialect', '方言', '方言'], idiom: ['관용 표현', 'Idiom', '慣用句', '慣用語'], politeness: ['인사·예절', 'Etiquette', '挨拶・礼儀', '問候與禮貌'] }
  const localized = Object.fromEntries(['ko', 'en', 'ja', 'zh-TW'].map((lang, i) => [lang, {
    expression, category: labels[category][i], categoryLabel: labels[category][i], hintLabel: labels[category][i],
    interventionLevel: 'inform', meaning: meanings[i], contextMeaning: meanings[i],
    tone: ['문맥에 따라 달라질 수 있음', 'Depends on context', '文脈によります', '依上下文而定'][i],
    senderGuide: { description: meanings[i], context: meanings[i], tone: labels[category][i], deliveryNote: ['등록된 예문에만 맥락 번역을 제공합니다.', 'Context translation is available for supported examples.', '登録された例文のみ文脈翻訳に対応します。', '僅支援已收錄例句的語境翻譯。'][i] },
    receiverGuide: { description: meanings[i], context: meanings[i], tone: labels[category][i] },
  }]))
  return { ...localized[from], localized }
}
export function extractSummary(messages, lang = 'ko', users = {}) {
  if (!messages.length) return null
  const recent = messages.slice(-30)
  const lines = recent.map(m => ({ text: m.translations?.[lang]?.cultural || m.translations?.[lang]?.standard || m.originalText, name: users[m.senderId]?.name || m.senderId }))
  const seen = new Set()
  const unique = lines.filter(x => { if (seen.has(x.text)) return false; seen.add(x.text); return true })
  return { mode: 'extractive', points: unique.slice(-6).map(x => `${x.name}: ${x.text}`), decisions: [] }
}
