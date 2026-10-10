import { Sentence } from './types.ts';

export interface DialogueSpeaker {
  hanzi: string;
  pinyin?: string;
  vietnamese?: string;
}

export interface ParsedDialogueSentence {
  rawIndex: number;
  speaker?: DialogueSpeaker;
  spokenContent: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  };
}

/**
 * Splits string by full-width colon (：) or half-width colon (:),
 * where colon occurs within the first 25 characters (standard speaker tag).
 */
function splitSpeakerAndContent(text: string): { speaker?: string; content: string } {
  if (!text) return { content: '' };
  const trimmed = text.trim();
  const match = trimmed.match(/^([^：:\n]{1,25})[：:]([\s\S]*)$/);
  if (match) {
    const rawSpeaker = match[1].trim();
    // Clean potential numeric prefixes like "01. 安娜" -> "安娜"
    const cleanedSpeaker = rawSpeaker.replace(/^\d+[\.\s]+/, '').trim() || rawSpeaker;
    const content = match[2].trim();
    return { speaker: cleanedSpeaker, content };
  }
  return { content: trimmed };
}

/**
 * Dedicated Bài Khóa Dialogue Parser
 * Isolates the speaker prefix from the spoken dialogue.
 * The audio synthesis engine MUST ONLY receive `spokenContent.hanzi`.
 */
export function parseDialogueSentence(sentence: Sentence): ParsedDialogueSentence {
  const hanziSplit = splitSpeakerAndContent(sentence.hanzi);
  const pinyinSplit = splitSpeakerAndContent(sentence.pinyin);
  const vnSplit = splitSpeakerAndContent(sentence.vietnamese);

  const hasSpeaker = !!hanziSplit.speaker;

  return {
    rawIndex: sentence.index,
    speaker: hasSpeaker
      ? {
          hanzi: hanziSplit.speaker!,
          pinyin: pinyinSplit.speaker,
          vietnamese: vnSplit.speaker,
        }
      : undefined,
    spokenContent: {
      hanzi: hanziSplit.content || sentence.hanzi,
      pinyin: pinyinSplit.content || sentence.pinyin,
      vietnamese: vnSplit.content || sentence.vietnamese,
    },
  };
}

/**
 * Parse an entire list of sentences for a lesson
 */
export function parseDialogueSentences(sentences: Sentence[]): ParsedDialogueSentence[] {
  return (sentences || []).map(parseDialogueSentence);
}
