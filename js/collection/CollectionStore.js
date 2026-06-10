const STORAGE_KEY = 'mystictarot_collection';

export class CollectionStore {
  constructor() {
    this.unlocked = new Map();
    this.drawHistory = [];
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.unlocked) {
        for (const [id, info] of Object.entries(data.unlocked)) {
          this.unlocked.set(id, info);
        }
      }
      if (data.drawHistory) {
        this.drawHistory = data.drawHistory;
      }
    } catch (e) {
      console.warn('CollectionStore: failed to load', e);
    }
  }

  _save() {
    try {
      const data = {
        unlocked: Object.fromEntries(this.unlocked),
        drawHistory: this.drawHistory
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('CollectionStore: failed to save', e);
    }
  }

  recordDraw(cardId, cardName, isReversed) {
    if (!this.unlocked.has(cardId)) {
      this.unlocked.set(cardId, {
        id: cardId,
        name: cardName,
        firstSeen: Date.now(),
        drawCount: 0,
        reverseCount: 0
      });
    }

    const info = this.unlocked.get(cardId);
    info.drawCount++;
    if (isReversed) info.reverseCount++;

    this.drawHistory.unshift({
      cardId,
      cardName,
      isReversed,
      timestamp: Date.now()
    });

    if (this.drawHistory.length > 500) {
      this.drawHistory = this.drawHistory.slice(0, 500);
    }

    this._save();
  }

  getUnlockedCards() {
    return Array.from(this.unlocked.values());
  }

  getCardInfo(cardId) {
    return this.unlocked.get(cardId) || null;
  }

  getDrawHistory(cardId) {
    return this.drawHistory.filter(h => h.cardId === cardId);
  }

  getReverseRate(cardId) {
    const info = this.unlocked.get(cardId);
    if (!info || info.drawCount === 0) return 0;
    return info.reverseCount / info.drawCount;
  }

  getRelatedCards(cardId) {
    const targetTimes = new Set();
    for (let i = 0; i < this.drawHistory.length; i++) {
      if (this.drawHistory[i].cardId === cardId) {
        const start = Math.max(0, i - 2);
        const end = Math.min(this.drawHistory.length - 1, i + 2);
        for (let j = start; j <= end; j++) {
          if (j !== i) targetTimes.add(this.drawHistory[j].timestamp);
        }
      }
    }

    const cooccurrence = new Map();
    for (const t of targetTimes) {
      const entry = this.drawHistory.find(h => h.timestamp === t);
      if (entry && entry.cardId !== cardId) {
        cooccurrence.set(entry.cardId, (cooccurrence.get(entry.cardId) || 0) + 1);
      }
    }

    return Array.from(cooccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ cardId: id, count }));
  }

  isUnlocked(cardId) {
    return this.unlocked.has(cardId);
  }

  getUnlockCount() {
    return this.unlocked.size;
  }

  clearAll() {
    this.unlocked.clear();
    this.drawHistory = [];
    this._save();
  }
}
