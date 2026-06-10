import { GalleryLayout } from './GalleryLayout.js';

export class GalleryUI {
  constructor() {
    this.overlay = null;
    this.galleryContainer = null;
    this.detailPanel = null;
    this.viewerContainer = null;
    this.layoutButtons = [];
    this.currentLayout = GalleryLayout.GRID;
    this._onLayoutChange = null;
    this._onClose = null;
    this._onBackFromViewer = null;
  }

  create(onLayoutChange, onClose, onBackFromViewer) {
    this._onLayoutChange = onLayoutChange;
    this._onClose = onClose;
    this._onBackFromViewer = onBackFromViewer;

    this.overlay = document.createElement('div');
    this.overlay.id = 'gallery-overlay';
    this.overlay.innerHTML = `
      <div id="gallery-header">
        <button id="gallery-close" class="gallery-btn">✕ 返回占卜</button>
        <div id="gallery-title">
          <span id="gallery-title-text">塔罗牌收藏图鉴</span>
          <span id="gallery-count"></span>
        </div>
        <div id="gallery-layout-switcher">
          <button class="layout-btn active" data-layout="grid">▦ 网格</button>
          <button class="layout-btn" data-layout="spiral">🌀 螺旋</button>
          <button class="layout-btn" data-layout="ring">◎ 环形</button>
        </div>
      </div>
      <div id="gallery-canvas-container"></div>
      <div id="gallery-detail-panel" class="glass-panel">
        <button id="detail-close" class="gallery-btn-small">✕</button>
        <div id="detail-card-name"></div>
        <div id="detail-stats">
          <div class="stat-item">
            <span class="stat-label">抽取次数</span>
            <span class="stat-value" id="stat-draw-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">逆位率</span>
            <span class="stat-value" id="stat-reverse-rate">0%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">首次出现</span>
            <span class="stat-value" id="stat-first-seen">-</span>
          </div>
        </div>
        <div id="detail-meaning-section">
          <div class="meaning-row">
            <span class="tag-up">正位</span>
            <span id="detail-up-meaning"></span>
          </div>
          <div class="meaning-row">
            <span class="tag-rev">逆位</span>
            <span id="detail-rev-meaning"></span>
          </div>
        </div>
        <div id="detail-related">
          <div class="related-title">关联卡牌</div>
          <div id="related-cards"></div>
        </div>
        <div id="detail-history">
          <div class="history-title">抽取历史</div>
          <div id="history-entries"></div>
        </div>
        <button id="btn-view-360" class="gallery-btn-primary">🔍 360° 查看卡牌</button>
      </div>
      <div id="card-viewer-container" style="display:none;">
        <button id="viewer-back" class="gallery-btn">← 返回图鉴</button>
      </div>
    `;

    this._injectStyles();
    document.body.appendChild(this.overlay);

    this.galleryContainer = this.overlay.querySelector('#gallery-canvas-container');
    this.detailPanel = this.overlay.querySelector('#gallery-detail-panel');
    this.viewerContainer = this.overlay.querySelector('#card-viewer-container');

    this._bindEvents();
    return this.overlay;
  }

  _injectStyles() {
    if (document.getElementById('gallery-styles')) return;
    const style = document.createElement('style');
    style.id = 'gallery-styles';
    style.textContent = `
      #gallery-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #050507; z-index: 5000; display: flex; flex-direction: column;
        font-family: 'Outfit', sans-serif; color: #fff;
      }
      #gallery-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 15px 25px; background: rgba(10,10,15,0.95);
        border-bottom: 1px solid rgba(255,215,0,0.2); z-index: 10;
        backdrop-filter: blur(10px);
      }
      #gallery-title { text-align: center; }
      #gallery-title-text {
        font-size: 20px; font-weight: 600; color: #ffd700;
        letter-spacing: 3px; text-transform: uppercase;
      }
      #gallery-count {
        font-size: 13px; color: rgba(255,255,255,0.5); margin-left: 10px;
      }
      #gallery-layout-switcher { display: flex; gap: 8px; }
      .layout-btn {
        background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3);
        color: #ccc; padding: 8px 16px; border-radius: 20px; cursor: pointer;
        font-size: 13px; font-family: 'Outfit', sans-serif; transition: all 0.3s;
      }
      .layout-btn:hover { background: rgba(255,215,0,0.2); color: #ffd700; }
      .layout-btn.active {
        background: #ffd700; color: #000; border-color: #ffd700; font-weight: 600;
      }
      .gallery-btn {
        background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.5);
        color: #fff; padding: 10px 20px; border-radius: 25px; cursor: pointer;
        font-size: 14px; font-family: 'Outfit', sans-serif; transition: all 0.3s;
        letter-spacing: 1px;
      }
      .gallery-btn:hover { background: #ffd700; color: #000; }
      .gallery-btn-small {
        position: absolute; top: 10px; right: 10px;
        background: none; border: none; color: rgba(255,255,255,0.5);
        cursor: pointer; font-size: 18px; padding: 5px 10px;
        transition: color 0.3s;
      }
      .gallery-btn-small:hover { color: #ffd700; }
      .gallery-btn-primary {
        width: 100%; padding: 12px; margin-top: 15px;
        background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
        border: 1px solid rgba(255,215,0,0.5); color: #ffd700;
        border-radius: 12px; cursor: pointer; font-size: 15px;
        font-family: 'Outfit', sans-serif; font-weight: 600;
        letter-spacing: 1px; transition: all 0.3s;
      }
      .gallery-btn-primary:hover {
        background: #ffd700; color: #000;
        box-shadow: 0 0 20px rgba(255,215,0,0.3);
      }
      #gallery-canvas-container {
        flex: 1; position: relative; overflow: hidden;
      }
      #gallery-detail-panel {
        position: absolute; right: 20px; top: 80px; width: 320px;
        max-height: calc(100vh - 120px); overflow-y: auto;
        background: rgba(10,10,15,0.92); backdrop-filter: blur(15px);
        border: 1px solid rgba(255,215,0,0.2); border-radius: 20px;
        padding: 25px; z-index: 20; display: none;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: slideInRight 0.4s ease-out;
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      #detail-card-name {
        font-size: 28px; font-weight: 600; color: #ffd700;
        margin-bottom: 15px; padding-right: 30px;
      }
      #detail-stats {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
        margin-bottom: 20px;
      }
      .stat-item {
        text-align: center; padding: 10px;
        background: rgba(255,255,255,0.03); border-radius: 10px;
      }
      .stat-label { display: block; font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
      .stat-value { display: block; font-size: 18px; font-weight: 600; color: #ffd700; }
      #detail-meaning-section { margin-bottom: 20px; }
      .meaning-row {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .meaning-row span:last-child { font-size: 14px; color: #ccc; }
      #detail-related { margin-bottom: 20px; }
      .related-title, .history-title {
        font-size: 14px; color: rgba(255,255,255,0.5);
        margin-bottom: 8px; letter-spacing: 1px;
      }
      #related-cards { display: flex; flex-wrap: wrap; gap: 8px; }
      .related-card-tag {
        background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3);
        color: #ffd700; padding: 4px 12px; border-radius: 15px; font-size: 12px;
      }
      #detail-history { margin-bottom: 10px; }
      #history-entries { max-height: 150px; overflow-y: auto; }
      .history-entry {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
        font-size: 12px; color: rgba(255,255,255,0.6);
      }
      #card-viewer-container {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 30; background: #050507;
      }
      #viewer-back {
        position: absolute; top: 20px; left: 20px; z-index: 31;
      }
      #gallery-detail-panel::-webkit-scrollbar { width: 4px; }
      #gallery-detail-panel::-webkit-scrollbar-track { background: transparent; }
      #gallery-detail-panel::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 2px; }
      #history-entries::-webkit-scrollbar { width: 3px; }
      #history-entries::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 2px; }
      .tag-up {
        color: #ffd700; font-size: 11px; font-weight: bold;
        border: 1px solid #ffd700; padding: 2px 6px; border-radius: 4px;
        white-space: nowrap;
      }
      .tag-rev {
        color: #ff4500; font-size: 11px; font-weight: bold;
        border: 1px solid #ff4500; padding: 2px 6px; border-radius: 4px;
        white-space: nowrap;
      }
      @media (max-width: 768px) {
        #gallery-header { flex-wrap: wrap; gap: 10px; justify-content: center; }
        #gallery-detail-panel { width: calc(100% - 40px); right: 20px; top: auto; bottom: 20px; max-height: 50vh; }
        #detail-stats { grid-template-columns: 1fr 1fr 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  _bindEvents() {
    this.overlay.querySelector('#gallery-close').addEventListener('click', () => {
      if (this._onClose) this._onClose();
    });

    this.layoutButtons = this.overlay.querySelectorAll('.layout-btn');
    this.layoutButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.layoutButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayout = btn.dataset.layout;
        if (this._onLayoutChange) this._onLayoutChange(this.currentLayout);
      });
    });

    this.overlay.querySelector('#detail-close').addEventListener('click', () => {
      this.hideDetail();
    });

    this.overlay.querySelector('#viewer-back').addEventListener('click', () => {
      if (this._onBackFromViewer) this._onBackFromViewer();
    });
  }

  getGalleryContainer() {
    return this.galleryContainer;
  }

  getViewerContainer() {
    return this.viewerContainer;
  }

  updateCount(unlocked, total) {
    const el = this.overlay.querySelector('#gallery-count');
    if (el) el.textContent = `${unlocked} / ${total}`;
  }

  showDetail(cardData, collectionInfo, tarotDB) {
    this.detailPanel.style.display = 'block';

    this.overlay.querySelector('#detail-card-name').textContent = cardData.name;
    this.overlay.querySelector('#stat-draw-count').textContent = collectionInfo.drawCount;
    this.overlay.querySelector('#stat-reverse-rate').textContent =
      Math.round(collectionInfo.reverseRate * 100) + '%';

    const firstSeen = collectionInfo.firstSeen
      ? new Date(collectionInfo.firstSeen).toLocaleDateString('zh-CN')
      : '-';
    this.overlay.querySelector('#stat-first-seen').textContent = firstSeen;

    this.overlay.querySelector('#detail-up-meaning').textContent = cardData.up;
    this.overlay.querySelector('#detail-rev-meaning').textContent = cardData.rev;

    const relatedContainer = this.overlay.querySelector('#related-cards');
    relatedContainer.innerHTML = '';
    if (collectionInfo.related && collectionInfo.related.length > 0) {
      for (const rel of collectionInfo.related) {
        const dbCard = tarotDB.find(c => c.id === rel.cardId);
        if (dbCard) {
          const tag = document.createElement('span');
          tag.className = 'related-card-tag';
          tag.textContent = `${dbCard.name} ×${rel.count}`;
          relatedContainer.appendChild(tag);
        }
      }
    } else {
      relatedContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3);font-size:12px;">暂无关联数据</span>';
    }

    const historyContainer = this.overlay.querySelector('#history-entries');
    historyContainer.innerHTML = '';
    if (collectionInfo.history && collectionInfo.history.length > 0) {
      const show = collectionInfo.history.slice(0, 20);
      for (const entry of show) {
        const row = document.createElement('div');
        row.className = 'history-entry';
        const date = new Date(entry.timestamp).toLocaleString('zh-CN', {
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        row.innerHTML = `
          <span>${date}</span>
          <span class="${entry.isReversed ? 'tag-rev' : 'tag-up'}">${entry.isReversed ? '逆位' : '正位'}</span>
        `;
        historyContainer.appendChild(row);
      }
    } else {
      historyContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3);font-size:12px;">暂无历史记录</span>';
    }
  }

  hideDetail() {
    this.detailPanel.style.display = 'none';
  }

  showViewer() {
    this.viewerContainer.style.display = 'block';
  }

  hideViewer() {
    this.viewerContainer.style.display = 'none';
  }

  setView360Handler(handler) {
    const btn = this.overlay.querySelector('#btn-view-360');
    if (btn) {
      btn.onclick = () => {
        if (handler) handler();
      };
    }
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    const style = document.getElementById('gallery-styles');
    if (style) style.remove();
    this.overlay = null;
  }
}
