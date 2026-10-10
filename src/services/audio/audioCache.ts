/**
 * YUYAN Audio In-Memory & Blob Cache
 * Ensures deduplication and memory safety with Object URL revocation.
 */

export class AudioCache {
  private cache: Map<string, { url: string; isBlob: boolean; timestamp: number }> = new Map();
  private maxEntries: number = 60;

  public get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    entry.timestamp = Date.now();
    return entry.url;
  }

  public set(key: string, url: string, isBlob: boolean = false): void {
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }
    this.cache.set(key, { url, isBlob, timestamp: Date.now() });
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry && entry.isBlob) {
        URL.revokeObjectURL(entry.url);
      }
      this.cache.delete(oldestKey);
    }
  }

  public clear(): void {
    for (const entry of this.cache.values()) {
      if (entry.isBlob) {
        URL.revokeObjectURL(entry.url);
      }
    }
    this.cache.clear();
  }
}

export const audioCache = new AudioCache();
