/**
 * YUYAN Audio System Utilities
 */

export function generateAudioCacheKey(
  text: string,
  lang: string = 'zh-CN',
  voice: string = 'default',
  rate: number = 1.0,
  pitch: number = 1.0
): string {
  const normalized = `${text.trim()}|${lang}|${voice}|${rate.toFixed(2)}|${pitch.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `yuyan_audio_${Math.abs(hash).toString(36)}`;
}

/**
 * Clean and normalize Chinese text for TTS speech synthesis.
 * Strips English annotations, IPA brackets, and extraneous punctuation.
 */
export function sanitizeChineseSpeechText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*\)/g, '') // remove (pinyin) or (notes)
    .replace(/\s*\[[^\]]*\]/g, '') // remove [notes]
    .replace(/["'“”‘’]/g, '')
    .trim();
}

/**
 * Verify whether a string contains Hanzi characters
 */
export function containsHanzi(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}
