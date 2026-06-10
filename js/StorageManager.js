class StorageManager {
  constructor(storageKey = 'tarot_gallery_data') {
    this.storageKey = storageKey;
    this.data = this._loadData();
  }

  _loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load gallery data from localStorage:', e);
    }
    return {
      unlockedCards: {},
      drawHistory: []
    };
  }

  _saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save gallery data to localStorage:', e);
    }
  }

  unlockCard(cardId, isReversed, timestamp = Date.now()) {
    if (!this.data.unlockedCards[cardId]) {
      this.data.unlockedCards[cardId] = {
        firstUnlockTime: timestamp,
        drawCount: 0,
        reverseCount: 0,
        uprightCount: 0
      };
    }

    const cardData = this.data.unlockedCards[cardId];
    cardData.drawCount++;
    cardData.lastDrawTime = timestamp;

    if (isReversed) {
      cardData.reverseCount++;
    } else {
      cardData.uprightCount++;
    }

    this.data.drawHistory.unshift({
      cardId,
      isReversed,
      timestamp
    });

    if (this.data.drawHistory.length > 500) {
      this.data.drawHistory = this.data.drawHistory.slice(0, 500);
    }

    this._saveData();
    return { ...cardData };
  }

  isCardUnlocked(cardId) {
    return !!this.data.unlockedCards[cardId];
  }

  getUnlockedCardIds() {
    return Object.keys(this.data.unlockedCards);
  }

  getCardStats(cardId) {
    return this.data.unlockedCards[cardId] ? { ...this.data.unlockedCards[cardId] } : null;
  }

  getDrawHistory(cardId = null, limit = 100) {
    let history = [...this.data.drawHistory];
    if (cardId) {
      history = history.filter(h => h.cardId === cardId);
    }
    return history.slice(0, limit);
  }

  getTotalDraws() {
    return this.data.drawHistory.length;
  }

  getUnlockedCount() {
    return Object.keys(this.data.unlockedCards).length;
  }

  resetAllData() {
    this.data = {
      unlockedCards: {},
      drawHistory: []
    };
    this._saveData();
  }
}

export { StorageManager };
