class GalleryUI {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.elements = {};
    this.currentLayout = 'grid';
    this._createElements();
    this._bindEvents();
  }

  _createElements() {
    this._createGalleryButton();
    this._createGalleryPanel();
    this._createViewerModal();
  }

  _createGalleryButton() {
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.id = 'btn-gallery';
    btn.innerHTML = '📖 收藏图鉴';
    btn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid #ffd700;
      color: #ffd700;
      z-index: 9999;
      pointer-events: auto;
    `;
    document.body.appendChild(btn);
    this.elements.galleryBtn = btn;
  }

  _createGalleryPanel() {
    const panel = document.createElement('div');
    panel.id = 'gallery-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 7, 0.98);
      z-index: 10000;
      display: none;
      flex-direction: column;
      font-family: 'Outfit', sans-serif;
      color: white;
    `;

    panel.innerHTML = `
      <div id="gallery-header" style="
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        background: rgba(15, 15, 20, 0.9);
      ">
        <div>
          <h2 style="margin: 0; color: #ffd700; font-size: 24px; letter-spacing: 2px;">🔮 塔罗图鉴</h2>
          <p id="gallery-stats" style="margin: 5px 0 0; color: rgba(255,255,255,0.5); font-size: 14px;">已收集: 0 / 22</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <div id="layout-switcher" style="display: flex; gap: 8px; margin-right: 20px;">
            <button class="layout-btn active" data-layout="grid" style="
              padding: 8px 16px;
              background: rgba(255,215,0,0.2);
              border: 1px solid #ffd700;
              color: #ffd700;
              border-radius: 20px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.3s;
            ">网格</button>
            <button class="layout-btn" data-layout="spiral" style="
              padding: 8px 16px;
              background: transparent;
              border: 1px solid rgba(255,215,0,0.3);
              color: rgba(255,255,255,0.6);
              border-radius: 20px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.3s;
            ">螺旋</button>
            <button class="layout-btn" data-layout="ring" style="
              padding: 8px 16px;
              background: transparent;
              border: 1px solid rgba(255,215,0,0.3);
              color: rgba(255,255,255,0.6);
              border-radius: 20px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.3s;
            ">环形</button>
          </div>
          <button id="btn-close-gallery" style="
            width: 40px;
            height: 40px;
            background: transparent;
            border: 1px solid rgba(255,215,0,0.3);
            color: white;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          ">×</button>
        </div>
      </div>
      <div id="gallery-3d-container" style="
        flex: 1;
        position: relative;
      "></div>
      <div id="gallery-hint" style="
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255,255,255,0.4);
        font-size: 13px;
        pointer-events: none;
        z-index: 10;
      ">点击已解锁的卡牌查看详情 · 拖拽旋转视角 · 滚轮缩放</div>
    `;

    document.body.appendChild(panel);
    this.elements.galleryPanel = panel;
    this.elements.galleryContainer = panel.querySelector('#gallery-3d-container');
    this.elements.galleryStats = panel.querySelector('#gallery-stats');
    this.elements.closeBtn = panel.querySelector('#btn-close-gallery');
    this.elements.layoutBtns = panel.querySelectorAll('.layout-btn');
  }

  _createViewerModal() {
    const modal = document.createElement('div');
    modal.id = 'card-viewer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 7, 0.95);
      z-index: 20000;
      display: none;
      flex-direction: column;
      font-family: 'Outfit', sans-serif;
    `;

    modal.innerHTML = `
      <div id="viewer-header" style="
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 215, 0, 0.2);
      ">
        <div id="viewer-card-info">
          <h2 id="viewer-card-name" style="margin: 0; color: #ffd700; font-size: 28px;">卡牌名称</h2>
          <p id="viewer-card-meaning" style="margin: 5px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">卡牌含义</p>
        </div>
        <button id="btn-close-viewer" style="
          width: 40px;
          height: 40px;
          background: transparent;
          border: 1px solid rgba(255,215,0,0.3);
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="display: flex; flex: 1; overflow: hidden;">
        <div id="viewer-3d-container" style="
          flex: 1;
          position: relative;
        "></div>
        <div id="viewer-sidebar" style="
          width: 320px;
          padding: 25px;
          background: rgba(15, 15, 20, 0.9);
          border-left: 1px solid rgba(255, 215, 0, 0.15);
          overflow-y: auto;
        ">
          <div id="viewer-stats" style="margin-bottom: 25px;">
            <h3 style="color: #ffd700; font-size: 16px; margin: 0 0 15px; letter-spacing: 1px;">📊 抽取统计</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
                <div style="font-size: 24px; color: #ffd700; font-weight: 600;" id="stat-total">0</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.4);">总抽取次数</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
                <div style="font-size: 24px; color: #4ade80; font-weight: 600;" id="stat-upright">0</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.4);">正位次数</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
                <div style="font-size: 24px; color: #f87171; font-weight: 600;" id="stat-reverse">0</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.4);">逆位次数</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
                <div style="font-size: 24px; color: #60a5fa; font-weight: 600;" id="stat-first">-</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.4);">首次解锁</div>
              </div>
            </div>
          </div>
          <div>
            <h3 style="color: #ffd700; font-size: 16px; margin: 0 0 15px; letter-spacing: 1px;">📜 最近抽取</h3>
            <div id="viewer-history" style="display: flex; flex-direction: column; gap: 8px;"></div>
          </div>
        </div>
      </div>
      <div id="viewer-controls-hint" style="
        position: absolute;
        bottom: 20px;
        left: calc(50% - 160px);
        color: rgba(255,255,255,0.4);
        font-size: 12px;
        pointer-events: none;
      ">拖拽旋转卡牌 · 滚轮缩放 · 松手3秒后自动旋转</div>
    `;

    document.body.appendChild(modal);
    this.elements.viewerModal = modal;
    this.elements.viewerContainer = modal.querySelector('#viewer-3d-container');
    this.elements.viewerCardName = modal.querySelector('#viewer-card-name');
    this.elements.viewerCardMeaning = modal.querySelector('#viewer-card-meaning');
    this.elements.closeViewerBtn = modal.querySelector('#btn-close-viewer');
    this.elements.statTotal = modal.querySelector('#stat-total');
    this.elements.statUpright = modal.querySelector('#stat-upright');
    this.elements.statReverse = modal.querySelector('#stat-reverse');
    this.elements.statFirst = modal.querySelector('#stat-first');
    this.elements.viewerHistory = modal.querySelector('#viewer-history');
  }

  _bindEvents() {
    this.elements.galleryBtn.addEventListener('click', () => {
      this.showGallery();
      if (this.callbacks.onOpenGallery) {
        this.callbacks.onOpenGallery();
      }
    });

    this.elements.closeBtn.addEventListener('click', () => {
      this.hideGallery();
      if (this.callbacks.onCloseGallery) {
        this.callbacks.onCloseGallery();
      }
    });

    this.elements.closeViewerBtn.addEventListener('click', () => {
      this.hideViewer();
      if (this.callbacks.onCloseViewer) {
        this.callbacks.onCloseViewer();
      }
    });

    this.elements.layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const layout = btn.dataset.layout;
        this.setLayout(layout);
        if (this.callbacks.onLayoutChange) {
          this.callbacks.onLayoutChange(layout);
        }
      });
    });
  }

  setLayout(layout) {
    this.currentLayout = layout;
    this.elements.layoutBtns.forEach(btn => {
      if (btn.dataset.layout === layout) {
        btn.classList.add('active');
        btn.style.background = 'rgba(255,215,0,0.2)';
        btn.style.borderColor = '#ffd700';
        btn.style.color = '#ffd700';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'rgba(255,215,0,0.3)';
        btn.style.color = 'rgba(255,255,255,0.6)';
      }
    });
  }

  showGallery() {
    this.elements.galleryPanel.style.display = 'flex';
  }

  hideGallery() {
    this.elements.galleryPanel.style.display = 'none';
  }

  showViewer() {
    this.elements.viewerModal.style.display = 'flex';
  }

  hideViewer() {
    this.elements.viewerModal.style.display = 'none';
  }

  updateStats(unlocked, total) {
    this.elements.galleryStats.textContent = `已收集: ${unlocked} / ${total}`;
  }

  showCardDetails(cardData, stats, history) {
    this.elements.viewerCardName.textContent = cardData.name;
    this.elements.viewerCardMeaning.textContent = `正位: ${cardData.up} | 逆位: ${cardData.rev}`;

    this.elements.statTotal.textContent = stats ? stats.drawCount : 0;
    this.elements.statUpright.textContent = stats ? stats.uprightCount : 0;
    this.elements.statReverse.textContent = stats ? stats.reverseCount : 0;

    if (stats && stats.firstUnlockTime) {
      const date = new Date(stats.firstUnlockTime);
      this.elements.statFirst.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      this.elements.statFirst.textContent = '-';
    }

    this.elements.viewerHistory.innerHTML = '';
    if (history && history.length > 0) {
      history.slice(0, 10).forEach(h => {
        const item = document.createElement('div');
        const date = new Date(h.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        item.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-size: 13px;
        `;
        item.innerHTML = `
          <span style="color: rgba(255,255,255,0.7);">${timeStr}</span>
          <span style="
            color: ${h.isReversed ? '#f87171' : '#4ade80'};
            font-weight: 600;
            font-size: 12px;
          ">${h.isReversed ? '逆位' : '正位'}</span>
        `;
        this.elements.viewerHistory.appendChild(item);
      });
    } else {
      this.elements.viewerHistory.innerHTML = '<div style="color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; padding: 20px;">暂无抽取记录</div>';
    }
  }

  getGalleryContainer() {
    return this.elements.galleryContainer;
  }

  getViewerContainer() {
    return this.elements.viewerContainer;
  }

  isGalleryVisible() {
    return this.elements.galleryPanel.style.display === 'flex';
  }

  isViewerVisible() {
    return this.elements.viewerModal.style.display === 'flex';
  }
}

export { GalleryUI };
