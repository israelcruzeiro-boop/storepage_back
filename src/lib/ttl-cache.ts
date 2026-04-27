interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<K, V> {
  private readonly entries = new Map<K, CacheEntry<V>>();

  public constructor(private readonly ttlMs: number) {}

  public get(key: K): V | null {
    if (this.ttlMs <= 0) {
      return null;
    }

    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  public set(key: K, value: V): void {
    if (this.ttlMs <= 0) {
      return;
    }

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public delete(key: K): void {
    this.entries.delete(key);
  }
}
