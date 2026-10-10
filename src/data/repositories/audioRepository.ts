/**
 * YUYAN Audio Repository
 * Resolves audio metadata and tracks for all learning entities (lesson, sentence, vocab, reading, hanzi).
 */

import { AudioTrackMetadata } from '../../services/audio/audioTypes';
import { lessonRepository } from '../hsk/lessonRepository';
import { vocabularyRepository } from './vocabularyRepository';
import { hanziRepository } from './hanziRepository';

export class AudioRepository {
  public resolveSentenceTrack(level: number, lessonNumber: number, sentenceIndex: number): AudioTrackMetadata | undefined {
    const lesson = lessonRepository.getLesson(level, lessonNumber);
    if (!lesson) return undefined;
    const sentence = lesson.lessonText.find((s) => s.index === sentenceIndex);
    if (!sentence) return undefined;

    const sentenceId = `${lesson.lessonId}_s${sentence.index}`;
    return {
      id: `sentence_${sentenceId}`,
      text: sentence.hanzi,
      pinyin: sentence.pinyin,
      entityType: 'sentence',
      entityId: sentenceId,
      lang: 'zh-CN',
    };
  }

  public resolveVocabTrack(hanzi: string): AudioTrackMetadata | undefined {
    const words = vocabularyRepository.getByWord(hanzi);
    const pinyin = words[0]?.['Pinyin'];

    return {
      id: `vocab_${hanzi}`,
      text: hanzi,
      pinyin,
      entityType: 'vocabulary',
      entityId: hanzi,
      lang: 'zh-CN',
    };
  }

  public resolveHanziTrack(char: string): AudioTrackMetadata | undefined {
    const hanziEntity = hanziRepository.getByChar(char);
    const pinyin = hanziEntity?.pinyin[0];

    return {
      id: `hanzi_${char}`,
      text: char,
      pinyin,
      entityType: 'hanzi',
      entityId: char,
      lang: 'zh-CN',
    };
  }
}

export const audioRepository = new AudioRepository();
