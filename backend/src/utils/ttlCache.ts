type CacheRecord<T> = { value: T; expiresAt: number };

export class TTLCache<T> {
  private readonly store = new Map<string, CacheRecord<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;
    if (record.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    this.store.delete(key);
    this.store.set(key, record);
    return record.value;
  }

  set(key: string, value: T) {
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value as string | undefined;
      if (!oldest) break;
      this.store.delete(oldest);
    }
  }

  get size() {
    return this.store.size;
  }
}
