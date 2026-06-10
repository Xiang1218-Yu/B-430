const STORAGE_KEY = 'mystic_tarot_collection';

export class CollectionManager {
    constructor() {
        this.unlockedCards = new Map();
        this.drawHistory = [];
        this.listeners = new Set();
        this._loadFromStorage();
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.unlockedCards = new Map(data.unlockedCards || []);
                this.drawHistory = data.drawHistory || [];
            }
        } catch (e) {
            console.warn('Failed to load collection from storage:', e);
            this.unlockedCards = new Map();
            this.drawHistory = [];
        }
    }

    _saveToStorage() {
        try {
            const data = {
                unlockedCards: Array.from(this.unlockedCards.entries()),
                drawHistory: this.drawHistory
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save collection to storage:', e);
        }
    }

    addDraw(cardData, isReversed) {
        const cardId = cardData.id;
        
        if (!this.unlockedCards.has(cardId)) {
            this.unlockedCards.set(cardId, {
                ...cardData,
                firstDrawAt: Date.now(),
                drawCount: 0,
                upCount: 0,
                revCount: 0
            });
        }

        const cardRecord = this.unlockedCards.get(cardId);
        cardRecord.drawCount++;
        if (isReversed) {
            cardRecord.revCount++;
        } else {
            cardRecord.upCount++;
        }

        const historyEntry = {
            id: Date.now() + Math.random(),
            cardId: cardId,
            cardName: cardData.name,
            isReversed: isReversed,
            timestamp: Date.now()
        };
        this.drawHistory.unshift(historyEntry);

        if (this.drawHistory.length > 200) {
            this.drawHistory = this.drawHistory.slice(0, 200);
        }

        this._saveToStorage();
        this._notifyChange();

        return historyEntry;
    }

    isUnlocked(cardId) {
        return this.unlockedCards.has(cardId);
    }

    getUnlockedCards() {
        return Array.from(this.unlockedCards.values());
    }

    getCardHistory(cardId) {
        return this.drawHistory.filter(entry => entry.cardId === cardId);
    }

    getCardStats(cardId) {
        const card = this.unlockedCards.get(cardId);
        if (!card) return null;
        return {
            drawCount: card.drawCount,
            upCount: card.upCount,
            revCount: card.revCount,
            firstDrawAt: card.firstDrawAt,
            upRate: card.drawCount > 0 ? (card.upCount / card.drawCount) : 0
        };
    }

    getRecentHistory(limit = 20) {
        return this.drawHistory.slice(0, limit);
    }

    getTotalUnlocked() {
        return this.unlockedCards.size;
    }

    getTotalDraws() {
        return this.drawHistory.length;
    }

    clearAll() {
        this.unlockedCards.clear();
        this.drawHistory = [];
        this._saveToStorage();
        this._notifyChange();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    _notifyChange() {
        this.listeners.forEach(cb => cb(this));
    }
}

export const collectionManager = new CollectionManager();
