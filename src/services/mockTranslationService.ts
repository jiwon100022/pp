import type { LanguageCode, Translation, TranslationMap } from '../types'
import { normalizeText } from '../utils/text'
import type { TranslationService } from './translationService'

/** 문자열은 기본 번역만, 객체는 기본 번역 + 부가 정보(문화 맥락, 한국어 의미 확인 등) */
type Phrase = Record<LanguageCode, string | Translation>

/** 기본 번역 + 한국어 의미 확인 */
const m = (standard: string, meaningKo: string): Translation => ({
  standard,
  meaningKo: { standard: meaningKo },
})

/**
 * 시연용 문장 사전. 여기에 없는 문장은 번역하지 않는다.
 * 모든 번역/한국어 의미 확인 값은 demo 데이터이며 실제 번역 엔진 결과가 아니다.
 */
const PHRASES: Phrase[] = [
  // Global Project Team 기본 대화
  {
    ja: '今日の資料、もう確認した？',
    ko: '오늘 자료 벌써 확인했어?',
    en: "Have you checked today's materials yet?",
    'zh-TW': '今天的資料已經確認了嗎？',
  },
  {
    ko: '응 거의 다 봤어',
    ja: m('うん、ほとんど見たよ', '응, 거의 다 봤어'),
    en: m("Yeah, I've gone through most of it", '응, 대부분 훑어봤어'),
    'zh-TW': m('嗯，差不多都看完了', '응, 거의 다 봤어'),
  },
  {
    en: 'I think we should finish the slides today.',
    ko: '오늘 슬라이드를 끝내는 게 좋을 것 같아.',
    ja: '今日中にスライドを仕上げたほうがいいと思う。',
    'zh-TW': '我覺得我們今天應該把投影片完成。',
  },
  {
    'zh-TW': '我下午可以幫忙確認。',
    ko: '오후에 내가 확인을 도와줄 수 있어.',
    ja: '午後なら確認を手伝えるよ。',
    en: 'I can help check it this afternoon.',
  },
  {
    ko: '고마워!',
    ja: m('ありがとう！', '고마워!'),
    en: m('Thanks!', '고마워!'),
    'zh-TW': m('謝謝！', '고마워!'),
  },
  {
    ko: '오늘 발표 어땠어?',
    ja: m('今日の発表どうだった？', '오늘 발표 어땠어?'),
    en: m("How did today's presentation go?", '오늘 발표 어떻게 됐어?'),
    'zh-TW': m('今天的發表怎麼樣？', '오늘 발표 어땠어?'),
  },
  {
    ko: '진짜 힘들었어ㅋㅋ',
    ja: m('本当に大変だったよ（笑）', '정말 힘들었어(웃음)'),
    en: m('It was really tough lol', '정말 힘들었어ㅋㅋ'),
    'zh-TW': m('真的好累哈哈', '진짜 피곤했어ㅋㅋ'),
  },
  {
    ko: '무슨 일 있었어?',
    ja: m('何かあった？', '무슨 일 있었어?'),
    en: m('Did something happen?', '무슨 일이 있었어?'),
    'zh-TW': m('發生什麼事了嗎？', '무슨 일 생겼어?'),
  },

  // 시연 자동 답장 (scriptedDemoReplies)
  {
    ja: 'それは大変だったね。何があったの？',
    ko: '그거 힘들었겠다. 무슨 일 있었어?',
    en: 'That must have been tough. What happened?',
    'zh-TW': '那真是辛苦了。發生什麼事了？',
  },
  {
    en: 'That sounds rough. Are you okay?',
    ko: '힘들었겠다. 괜찮아?',
    ja: 'それは大変だったね。大丈夫？',
    'zh-TW': '聽起來很辛苦。你還好嗎？',
  },

  // 문화 표현 대표 문장 (demo 데이터: 실제 번역 엔진 결과가 아닌 시연용 예시)
  {
    ko: '오늘 발표 진짜 억까당함ㅋㅋㅋ',
    ja: {
      standard: '今日は発表で本当に理不尽な目に遭った（笑）',
      cultural: '今日は発表で、ちょっと理不尽な目にあったw',
      meaningKo: {
        standard: '오늘 발표에서 정말 부당한 일을 당했어(웃음)',
        cultural: '오늘 발표에서 좀 억울한 일을 당했어ㅋㅋ',
      },
      nuance: '가벼운 불평 · 인터넷식 웃음 표현',
    },
    en: {
      standard: 'I was treated really unfairly at the presentation today lol',
      cultural: 'Got hit with some unfair stuff at the presentation today lol',
      meaningKo: {
        standard: '오늘 발표에서 정말 부당한 대우를 받았어ㅋㅋ',
        cultural: '오늘 발표에서 좀 억울한 일을 겪었어ㅋㅋ',
      },
      nuance: '가벼운 불평 · 캐주얼한 구어체',
    },
    'zh-TW': {
      standard: '今天發表真的被不公平對待了哈哈哈',
      cultural: '今天發表遇到超冤的事哈哈哈',
      meaningKo: {
        standard: '오늘 발표에서 정말 불공평한 대우를 받았어ㅋㅋㅋ',
        cultural: '오늘 발표에서 엄청 억울한 일을 겪었어ㅋㅋㅋ',
      },
      nuance: '가벼운 푸념 · 대만식 구어 표현(超冤)',
    },
  },
  {
    ko: '뭐하노 아직도 안 왔나',
    ja: {
      standard: '何してるの、まだ来ていないの？',
      cultural: 'ねえ、何してんの？まだ来ないの～？',
      meaningKo: {
        standard: '뭐 하고 있어, 아직 안 온 거야?',
        cultural: '있잖아, 뭐 해? 아직 안 와~?',
      },
      nuance: '친근한 재촉 · 부드러운 반말체',
    },
    en: {
      standard: "What are you doing? You still haven't arrived?",
      cultural: "Hey, what's keeping you? You're still not here?",
      meaningKo: {
        standard: '뭐 하고 있어? 아직도 도착 안 했어?',
        cultural: '야, 왜 이렇게 늦어? 아직 안 왔어?',
      },
      nuance: '친근한 재촉 · 캐주얼한 말투',
    },
    'zh-TW': {
      standard: '你在做什麼？還沒到嗎？',
      cultural: '欸，你在幹嘛啦？怎麼還沒到～',
      meaningKo: {
        standard: '뭐 하고 있어? 아직 도착 안 했어?',
        cultural: '야, 뭐 하는 거야~ 왜 아직 안 와~',
      },
      nuance: '친근한 재촉 · 구어체 어미(啦, ～)',
    },
  },
  {
    ko: '이번에는 진짜 발등에 불 떨어졌어',
    ja: {
      standard: '今回は本当に足の甲に火が落ちた',
      cultural: '今回は本当にお尻に火がついた',
      meaningKo: {
        standard: '이번에는 정말 발등 위에 불이 떨어졌다 (문자 그대로의 의미)',
        cultural: '이번에는 정말 엉덩이에 불이 붙었어 (= 매우 급하다는 일본어 관용구)',
      },
      nuance: "일본어 관용구 '尻に火がつく'로 대체",
    },
    en: {
      standard: 'This time fire really fell on the top of my foot',
      cultural: "This time I'm really under pressure — it has to be done now",
      meaningKo: {
        standard: '이번에 정말 발 위에 불이 떨어졌어 (문자 그대로의 의미)',
        cultural: '이번엔 정말 압박이 심해, 지금 당장 끝내야 해',
      },
      nuance: '관용구를 의미 중심으로 풀어 씀',
    },
    'zh-TW': {
      standard: '這次腳背上真的掉了火',
      cultural: '這次真的火燒眉毛了',
      meaningKo: {
        standard: '이번에 발등에 정말 불이 떨어졌다 (문자 그대로의 의미)',
        cultural: '이번엔 정말 눈썹에 불이 붙었어 (= 매우 급하다는 중국어 관용구)',
      },
      nuance: "중국어 관용구 '火燒眉毛'로 대체",
    },
  },

  // 추천 표현 (문화 표현을 풀어 쓴 문장)
  {
    ko: '오늘 발표 진짜 억울한 일 당했어ㅋㅋㅋ',
    ja: m('今日の発表で本当に理不尽なことがあったよ（笑）', '오늘 발표에서 정말 부당한 일이 있었어(웃음)'),
    en: m('Something really unfair happened at my presentation today lol', '오늘 발표에서 정말 불공평한 일이 있었어ㅋㅋ'),
    'zh-TW': m('今天發表真的遇到很冤枉的事哈哈哈', '오늘 발표에서 정말 억울한 일을 겪었어ㅋㅋㅋ'),
  },
  {
    ko: '뭐 하고 있어? 아직도 안 왔어?',
    ja: m('何してるの？まだ来てないの？', '뭐 해? 아직 안 왔어?'),
    en: m("What are you doing? You're still not here?", '뭐 하고 있어? 아직도 안 왔어?'),
    'zh-TW': m('你在做什麼？還沒到嗎？', '뭐 하고 있어? 아직 도착 안 했어?'),
  },
  {
    ko: '이번에는 진짜 급해서 당장 해야 해',
    ja: m('今回は本当に急ぎで、すぐにやらなきゃ', '이번엔 정말 급해서 바로 해야 해'),
    en: m('This time it’s really urgent, I have to do it right away', '이번엔 정말 급해서 바로 해야 해'),
    'zh-TW': m('這次真的很急，必須馬上做', '이번엔 정말 급해서 바로 해야 해'),
  },

  // 기타 시연 문장
  {
    ko: '오늘 회의 3시에 시작해',
    ja: m('今日の会議は3時に始まります。', '오늘 회의는 3시에 시작합니다.'),
    en: m("Today's meeting starts at 3.", '오늘 회의는 3시에 시작해.'),
    'zh-TW': m('今天的會議三點開始。', '오늘 회의는 세 시에 시작해.'),
  },
  {
    ko: '질문이 너무 많았어',
    ja: m('質問が多すぎたよ', '질문이 너무 많았어'),
    en: m('There were way too many questions', '질문이 정말 너무 많았어'),
    'zh-TW': m('問題太多了', '질문이 너무 많았어'),
  },
  {
    ko: '괜찮아?',
    ja: m('大丈夫？', '괜찮아?'),
    en: m('Are you okay?', '괜찮아?'),
    'zh-TW': m('還好嗎？', '괜찮아?'),
  },
  {
    ko: '알겠어, 이따 봐!',
    ja: m('わかった、また後でね！', '알겠어, 이따 보자!'),
    en: m('Got it, see you later!', '알겠어, 나중에 봐!'),
    'zh-TW': m('好的，待會見！', '좋아, 이따 봐!'),
  },
  {
    ko: '자료는 공유 폴더에 올려뒀어',
    ja: m('資料、共有フォルダに入れておいたよ', '자료, 공유 폴더에 넣어 뒀어'),
    en: m('I put the materials in the shared folder', '자료를 공유 폴더에 넣어 뒀어'),
    'zh-TW': m('資料我放在共用資料夾了', '자료는 공용 폴더에 넣어 뒀어'),
  },
  {
    ko: '회의록 정리해서 올려둘게!',
    ja: m('議事録をまとめてアップしておくね！', '회의록 정리해서 올려 둘게!'),
    en: m("I'll clean up the meeting notes and upload them!", '회의 노트 정리해서 올릴게!'),
    'zh-TW': m('我會整理會議紀錄再上傳！', '회의 기록 정리해서 올릴게!'),
  },
  {
    ko: '고마워! 내일 회의에서 봐.',
    ja: m('ありがとう！明日の会議で会おう。', '고마워! 내일 회의에서 보자.'),
    en: m('Thanks! See you at the meeting tomorrow.', '고마워! 내일 회의에서 봐.'),
    'zh-TW': m('謝謝！明天會議見。', '고마워! 내일 회의 때 봐.'),
  },
  {
    ko: '도와줘서 고마워!',
    ja: m('手伝ってくれてありがとう！', '도와줘서 고마워!'),
    en: m('Thanks for your help!', '도와줘서 고마워!'),
    'zh-TW': m('謝謝你的幫忙！', '도와줘서 고마워!'),
  },
  {
    ko: '내일 봐~',
    ja: m('また明日ね～', '내일 또 봐~'),
    en: m('See you tomorrow~', '내일 봐~'),
    'zh-TW': m('明天見～', '내일 봐~'),
  },
]

function toTranslation(value: string | Translation): Translation {
  return typeof value === 'string' ? { standard: value } : value
}

export function lookupTranslations(
  text: string,
  from: LanguageCode,
  targets: LanguageCode[],
): TranslationMap {
  const key = normalizeText(text)
  const phrase = PHRASES.find((p) => normalizeText(toTranslation(p[from]).standard) === key)
  if (!phrase) return {}

  const result: TranslationMap = {}
  for (const lang of targets) {
    const translation = { ...toTranslation(phrase[lang]) }
    // 한국어 의미 확인은 한국어 발신 메시지에만 해당
    if (from !== 'ko') delete translation.meaningKo
    result[lang] = translation
  }
  return result
}

const LATENCY_MS = 400

export const mockTranslationService: TranslationService = {
  translate(text, from, targets) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(lookupTranslations(text, from, targets)), LATENCY_MS)
    })
  },
}

