import type { CulturalAnalysis, LanguageCode } from '../types'
import { normalizeText } from '../utils/text'
import type { CultureService } from './cultureService'

type Case = { lang: LanguageCode; text: string; analysis: CulturalAnalysis }

/**
 * 시연용 대표 문장 3개. 이외 문장은 cultureDetected=false.
 * 세 사례 모두 "고쳐야 할 표현"이 아니므로 inform: 설명만 제공하고 수정 권고는 하지 않는다.
 */
const CASES: Case[] = [
  {
    lang: 'ko',
    text: '오늘 발표 진짜 억까당함ㅋㅋㅋ',
    analysis: {
      expression: '억까',
      category: '세대별 줄임말·유행어',
      categoryLabel: '세대·인터넷 표현',
      hintLabel: '문화 표현',
      interventionLevel: 'inform',
      meaning: '억울하거나 부당한 상황을 당했다는 의미',
      contextMeaning: '발표 과정에서 납득하기 어려운 불리한 일을 겪었다는 의미',
      tone: '가벼운 불평, 과장, 인터넷식 유머',
      senderGuide: {
        description:
          "'억까'는 한국 인터넷에서 억울하거나 부당한 상황을 가볍고 과장되게 표현할 때 사용하는 말이에요.",
        context: '발표 과정에서 납득하기 어려운 일을 겪었다는 의미로 사용됐어요.',
        tone: '가벼운 불평 + 과장 + 인터넷식 유머',
        deliveryNote: '상대 언어에서는 의미와 말투를 반영해 전달합니다.',
      },
      receiverGuide: {
        description: '한국 인터넷에서 가볍게 사용하는 표현입니다.',
        context: '발표에서 억울하거나 납득하기 어려운 일을 당했다는 의미로 사용됐어요.',
        tone: '진지한 항의라기보다 웃으며 푸념하는 느낌에 가까워요.',
      },
    },
  },
  {
    lang: 'ko',
    text: '뭐하노 아직도 안 왔나',
    analysis: {
      expression: '뭐하노',
      category: '지역별 사투리·지역 표현',
      categoryLabel: '지역 표현 · 경상도',
      hintLabel: '지역 표현',
      region: '경상도',
      interventionLevel: 'inform',
      meaning: '뭐 하고 있어?',
      contextMeaning: '상대를 친근하게 재촉하는 상황',
      tone: '친근함 + 약간의 재촉',
      senderGuide: {
        description: "'뭐하노'는 경상도 지역에서 사용하는 표현으로, '뭐 하고 있어?'라는 뜻이에요.",
        context: '아직 오지 않은 상대를 친근하게 재촉하는 느낌으로 사용됐어요.',
        tone: '친근함 + 약간의 재촉',
        deliveryNote: '상대 언어에서는 친근함과 재촉의 정도를 반영해 전달합니다.',
      },
      receiverGuide: {
        description: "경상도 지역에서 쓰는 사투리로, '뭐 하고 있어?'라는 뜻입니다.",
        context: '아직 도착하지 않은 상대를 친근하게 재촉하는 상황이에요.',
        tone: '화가 났다기보다 친한 사이에서 편하게 재촉하는 느낌이에요.',
      },
    },
  },
  {
    lang: 'ko',
    text: '이번에는 진짜 발등에 불 떨어졌어',
    analysis: {
      expression: '발등에 불이 떨어지다',
      category: '관용어·비유 표현',
      categoryLabel: '관용 표현',
      hintLabel: '관용 표현',
      interventionLevel: 'inform',
      meaning: '상황이 매우 급해져 당장 행동해야 한다는 의미',
      contextMeaning: '마감이나 일정이 임박한 상황',
      tone: '긴급함',
      senderGuide: {
        description:
          '문자 그대로 발에 불이 붙었다는 의미가 아니라, 상황이 매우 급해 당장 행동해야 한다는 뜻의 관용 표현이에요.',
        context: '마감이나 일정이 임박한 상황을 말하고 있어요.',
        tone: '긴급함',
        deliveryNote: '상대 언어에서는 문자 그대로 번역하지 않고 실제 의미를 반영해 전달합니다.',
      },
      receiverGuide: {
        description: '한국어 관용 표현으로, 실제로 발에 불이 붙었다는 뜻이 아닙니다.',
        context: '마감이나 일정이 임박해 당장 움직여야 하는 상황이에요.',
        tone: '실제 사고가 아니라 급하다는 감정을 강조하는 말이에요.',
      },
    },
  },
]

const LATENCY_MS = 150

export function detectCulture(text: string, lang: LanguageCode): CulturalAnalysis | null {
  const key = normalizeText(text)
  return CASES.find((c) => c.lang === lang && normalizeText(c.text) === key)?.analysis ?? null
}

export const mockCultureService: CultureService = {
  analyze(text, lang) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis = detectCulture(text, lang)
        resolve(analysis ? { cultureDetected: true, analysis } : { cultureDetected: false })
      }, LATENCY_MS)
    })
  },
}

