/**
 * YUYAN — Context Retrieval Service
 * Dynamically queries and retrieves relevant learning contexts from the 10,000+ library
 * without loading the entire dataset into memory at once.
 */

import {
  CONTEXT_INDEX,
  DOMAIN_METADATA,
  ContextIndexItem,
  TOTAL_CONTEXT_COUNT,
} from '../../data/ai/contextCatalogIndex';

export interface FullLearningContext extends ContextIndexItem {
  domainName: string;
  promptInstructions: string;
  targetHanzi?: string;
  targetPinyin?: string;
  targetVietnamese?: string;
  expectedResponseFormat: string;
  evaluationCriteria: string;
}

class ContextRetrievalService {
  private cache: Map<string, any[]> = new Map();

  public getTotalCount(): number {
    return TOTAL_CONTEXT_COUNT;
  }

  public getDomainMetadata() {
    return DOMAIN_METADATA;
  }

  /**
   * Search lightweight index in memory
   */
  public searchIndex(options: {
    query?: string;
    domainId?: string;
    level?: string;
    limit?: number;
  }): ContextIndexItem[] {
    const { query = '', domainId, level, limit = 50 } = options;
    const q = query.toLowerCase().trim();

    return CONTEXT_INDEX.filter((item) => {
      if (domainId && domainId !== 'all' && item.domainId !== domainId) {
        return false;
      }
      if (level && level !== 'all' && item.level.toLowerCase() !== level.toLowerCase()) {
        return false;
      }
      if (!q) return true;

      return (
        item.task.toLowerCase().includes(q) ||
        item.objective.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }).slice(0, limit);
  }

  /**
   * Fetch full context details dynamically from partitioned JSON
   */
  public async getContextDetails(id: string): Promise<FullLearningContext | null> {
    const indexItem = CONTEXT_INDEX.find((c) => c.id === id);
    if (!indexItem) return null;

    const domainId = indexItem.domainId;

    // Load domain partition from cache or dynamic import
    try {
      if (!this.cache.has(domainId)) {
        // In Vite, dynamic glob import allows on-demand loading of partition JSON
        const modules = import.meta.glob('../../data/ai/contexts/*.json');
        const pathKey = `../../data/ai/contexts/${domainId}.json`;
        if (modules[pathKey]) {
          const mod: any = await modules[pathKey]();
          const list = mod.default || mod;
          this.cache.set(domainId, list);
        }
      }

      const domainList = this.cache.get(domainId);
      if (domainList) {
        const full = domainList.find((item: any) => item.id === id);
        if (full) return full;
      }
    } catch (err) {
      console.warn('Failed to dynamically load context partition:', err);
    }

    // Fallback constructed from index item
    return {
      ...indexItem,
      domainName: DOMAIN_METADATA.find((d) => d.id === domainId)?.name || domainId,
      promptInstructions: `Tập trung vào nhiệm vụ: ${indexItem.task}`,
      expectedResponseFormat: 'Phản hồi sư phạm chuẩn Hán ngữ kèm Pinyin và dịch nghĩa tiếng Việt.',
      evaluationCriteria: 'Chuẩn xác ngữ pháp, ngữ âm và tính tự nhiên của câu.',
    };
  }

  /**
   * Get random context recommendation for daily drill
   */
  public getRandomContext(domainId?: string, level?: string): ContextIndexItem {
    const list = this.searchIndex({ domainId, level, limit: 1000 });
    if (list.length === 0) return CONTEXT_INDEX[0];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }
}

export const contextRetrievalService = new ContextRetrievalService();
