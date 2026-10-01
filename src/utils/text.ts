/** 공백, 끝 문장부호 차이는 같은 문장으로 본다. */
export function normalizeText(text: string) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\s?!.,~。？！、，～]+$/u, '')
    .toLowerCase()
}

