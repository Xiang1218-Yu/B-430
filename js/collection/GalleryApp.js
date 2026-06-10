import { CollectionStore } from './CollectionStore.js';
import { GalleryLayout } from './GalleryLayout.js';
import { GalleryScene } from './GalleryScene.js';
import { CardViewer } from './CardViewer.js';
import { GalleryUI } from './GalleryUI.js';

export class GalleryApp {
  constructor(config) {
    this.tarotDB = config.tarotDB;
    this.loadCardTexture = config.loadCardTexture;
    this.generateProceduralTexture = config.generateProceduralTexture;
    this.store = new CollectionStore();
    this.ui = new GalleryUI();
    this.galleryScene = null;
    this.cardViewer = null;
    this.isOpen = false;
    this._selectedCardData = null;
  }

  recordDraw(cardId, cardName, isReversed) {
    this.store.recordDraw(cardId, cardName, isReversed);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    const actionShelf = document.getElementById('action-shelf');
    if (actionShelf) actionShelf.style.display = 'none';

    const unlockedCards = this.store.getUnlockedCards();
    if (unlockedCards.length === 0) {
      this._showEmptyHint();
      this.isOpen = false;
      if (actionShelf) actionShelf.style.display = '';
      return;
    }

    const cardDataList = unlockedCards.map(info =>
      this.tarotDB.find(c => c.id === info.id) || { id: info.id, name: info.name, up: '未知', rev: '未知' }
    );

    this.ui.create(
      (layout) => this._onLayoutChange(layout, cardDataList),
      () => this.close(),
      () => this._onBackFromViewer()
    );

    this.ui.updateCount(unlockedCards.length, this.tarotDB.length);
    this.ui.setView360Handler(() => this._openCardViewer());

    this.galleryScene = new GalleryScene(
      this.ui.getGalleryContainer(),
      this.loadCardTexture,
      this.generateProceduralTexture
    );

    this.galleryScene.open(cardDataList, GalleryLayout.GRID, (cardData) => {
      this._onCardClick(cardData);
    });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    const actionShelf = document.getElementById('action-shelf');
    if (actionShelf) actionShelf.style.display = '';

    if (this.cardViewer) {
      this.cardViewer.destroy();
      this.cardViewer = null;
    }

    if (this.galleryScene) {
      this.galleryScene.close();
      this.galleryScene = null;
    }

    this.ui.destroy();
    this._selectedCardData = null;
  }

  _onLayoutChange(layoutType, cardDataList) {
    if (this.galleryScene) {
      this.galleryScene.switchLayout(cardDataList, layoutType);
    }
  }

  _onCardClick(cardData) {
    this._selectedCardData = cardData;
    const info = this.store.getCardInfo(cardData.id);
    if (!info) return;

    const reverseRate = this.store.getReverseRate(cardData.id);
    const history = this.store.getDrawHistory(cardData.id);
    const related = this.store.getRelatedCards(cardData.id);

    this.ui.showDetail(cardData, {
      drawCount: info.drawCount,
      reverseRate,
      firstSeen: info.firstSeen,
      history,
      related
    }, this.tarotDB);
  }

  _openCardViewer() {
    if (!this._selectedCardData) return;

    this.ui.showViewer();

    if (this.cardViewer) {
      this.cardViewer.destroy();
    }

    this.cardViewer = new CardViewer(
      this.ui.getViewerContainer(),
      this.loadCardTexture,
      this.generateProceduralTexture
    );

    this.cardViewer.open(this._selectedCardData, () => {
      this.ui.hideViewer();
    });
  }

  _onBackFromViewer() {
    if (this.cardViewer) {
      this.cardViewer.close();
    }
    this.ui.hideViewer();
  }

  _showEmptyHint() {
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(10,10,15,0.95); padding: 40px; border-radius: 24px;
      border: 2px solid #ffd700; z-index: 10000; text-align: center;
      color: #fff; font-family: 'Outfit', sans-serif;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
    `;
    hint.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🔮</div>
      <h2 style="color: #ffd700; margin-bottom: 15px;">图鉴为空</h2>
      <p style="color: rgba(255,255,255,0.6); margin-bottom: 25px;">尚未收集任何塔罗牌，请先进行占卜</p>
      <button id="empty-hint-close" style="
        padding: 12px 40px; background: #ffd700; color: #000; border: none;
        border-radius: 30px; cursor: pointer; font-weight: 600; font-size: 16px;
        font-family: 'Outfit', sans-serif;
      ">我知道了</button>
    `;
    document.body.appendChild(hint);
    hint.querySelector('#empty-hint-close').addEventListener('click', () => {
      hint.style.opacity = '0';
      hint.style.transition = 'opacity 0.3s';
      setTimeout(() => hint.remove(), 300);
    });
  }

  getUnlockCount() {
    return this.store.getUnlockCount();
  }
}
