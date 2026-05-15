export class MemoryFragments {
  constructor() {
    this.collected = new Set();
  }

  record(id) {
    this.collected.add(id);
    return this.collected.size;
  }

  has(id) {
    return this.collected.has(id);
  }

  toArray() {
    return [...this.collected];
  }

  clear() {
    this.collected.clear();
  }
}
