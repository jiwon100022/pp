import type { CulturalAnalysis, LanguageCode, Message, Room, TranslationMap, User } from '../src/types'
export const languages: LanguageCode[]
export const countries: Record<string, [string, LanguageCode]>
export function publicRooms(): Room[]
export function offlineTranslations(text: string, from: LanguageCode, targets?: LanguageCode[]): TranslationMap
export function analyzeOffline(text: string, from: LanguageCode): CulturalAnalysis | null
export function extractSummary(messages: Message[], lang?: LanguageCode, users?: Record<string, User>): { mode: 'extractive'; points: string[]; decisions: { label: string; value: string }[] } | null
