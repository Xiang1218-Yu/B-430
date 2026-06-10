import { collectionManager } from './collection-manager.js';
import { LayoutType } from './layout-manager.js';

export class GalleryUIManager {
    constructor() {
        this.galleryContainer = null;
        this.detailPanel = null;
        this.historyPanel = null;
        this.galleryBtn = null;
        this.closeBtn = null;
        this.layoutBtn = null;
        this.historyBtn = null;
        
        this.isHistoryOpen = false;
        this.currentCard = null;
        
        this.listeners = {
            open: new Set(),
            close: new Set(),
            layoutChange: new Set(),
            cardSelect: new Set()
        };
        
        this._init();
    }

    _init() {
        this._createGalleryButton();
        this._createGalleryContainer();
        this._createDetailPanel();
        this._createHistoryPanel();
        this._createControlBar();
        
        collectionManager.subscribe(() => {
            this._updateStats();
            if (this.currentCard) {
                this._updateCardDetail(this.currentCard);
            }
            this._updateHistoryList();
        });
    }

    _createGalleryButton() {
        const btn = document.createElement('button');
        btn.className = 'icon-btn';
        btn.id = 'btn-gallery';
        btn.innerHTML = '📖 收藏图鉴';
        btn.style.cssText = `
            background: rgba(255,215,0,0.1);
            border-color: #ffd700;
        `;
        btn.addEventListener('click', () => this._notify('open'));
        
        document.getElementById('action-shelf').appendChild(btn);
        this.galleryBtn = btn;
    }

    _createGalleryContainer() {
        const container = document.createElement('div');
        container.id = 'gallery-view';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(5, 5, 7, 0.98);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        const title = document.createElement('div');
        title.className = 'gallery-title';
        title.innerHTML = `
            <h2 style="margin: 0; color: #ffd700; font-size: 28px; letter-spacing: 4px;">📖 塔罗收藏图鉴</h2>
            <div id="gallery-stats" style="font-size: 14px; color: #888; margin-top: 8px;">
                已解锁: <span id="unlocked-count">0</span> / 22 &nbsp;|&nbsp; 
                总抽取: <span id="total-draws">0</span> 次
            </div>
        `;
        title.style.cssText = `
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            z-index: 10;
            font-family: 'Outfit', sans-serif;
        `;
        container.appendChild(title);
        
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'gallery-canvas-container';
        canvasContainer.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        container.appendChild(canvasContainer);
        
        document.body.appendChild(container);
        this.galleryContainer = container;
        this.canvasContainer = canvasContainer;
    }

    _createDetailPanel() {
        const panel = document.createElement('div');
        panel.id = 'gallery-detail-panel';
        panel.className = 'glass-panel';
        panel.style.cssText = `
            position: absolute;
            right: 30px;
            top: 50%;
            transform: translateY(-50%) translateX(100%);
            width: 320px;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            pointer-events: auto;
            z-index: 20;
        `;
        
        panel.innerHTML = `
            <h3 id="detail-card-name" style="color: #ffd700; font-size: 24px; margin: 0 0 16px 0; letter-spacing: 2px;">卡牌名称</h3>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">正位含义</div>
                <div id="detail-up-meaning" style="color: #ccc; font-size: 14px; line-height: 1.6;">正位含义...</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">逆位含义</div>
                <div id="detail-rev-meaning" style="color: #ccc; font-size: 14px; line-height: 1.6;">逆位含义...</div>
            </div>
            <div style="border-top: 1px solid rgba(255,215,0,0.2); padding-top: 16px; margin-top: 16px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">抽取统计</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; text-align: center;">
                        <div id="stat-total" style="color: #ffd700; font-size: 24px; font-weight: 600;">0</div>
                        <div style="font-size: 11px; color: #888;">总次数</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; text-align: center;">
                        <div id="stat-up-rate" style="color: #ffd700; font-size: 24px; font-weight: 600;">0%</div>
                        <div style="font-size: 11px; color: #888;">正位率</div>
                    </div>
                    <div style="background: rgba(255,215,0,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                        <div id="stat-up" style="color: #ffd700; font-size: 20px; font-weight: 600;">0</div>
                        <div style="font-size: 11px; color: #888;">正位</div>
                    </div>
                    <div style="background: rgba(255,69,0,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                        <div id="stat-rev" style="color: #ff4500; font-size: 20px; font-weight: 600;">0</div>
                        <div style="font-size: 11px; color: #888;">逆位</div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,215,0,0.2);">
                <div style="font-size: 12px; color: #888; margin-bottom: 6px;">首次抽取</div>
                <div id="first-draw" style="color: #ccc; font-size: 13px;">-</div>
            </div>
            <button id="close-detail-btn" style="
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                background: rgba(255,215,0,0.1);
                border: 1px solid rgba(255,215,0,0.4);
                color: #ffd700;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                font-family: 'Outfit', sans-serif;
                transition: all 0.3s;
            ">返回图鉴</button>
        `;
        
        this.galleryContainer.appendChild(panel);
        this.detailPanel = panel;
        
        panel.querySelector('#close-detail-btn').addEventListener('click', () => {
            this.hideDetailPanel();
            this._notify('closeDetail');
        });
    }

    _createHistoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'gallery-history-panel';
        panel.className = 'glass-panel';
        panel.style.cssText = `
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%) translateX(-100%);
            width: 280px;
            max-height: 70vh;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            pointer-events: auto;
            z-index: 20;
            display: flex;
            flex-direction: column;
        `;
        
        panel.innerHTML = `
            <h3 style="color: #ffd700; font-size: 18px; margin: 0 0 16px 0; letter-spacing: 2px; display: flex; justify-content: space-between; align-items: center;">
                <span>📜 抽取历史</span>
                <span id="history-count" style="font-size: 12px; color: #888;">0</span>
            </h3>
            <div id="history-list-container" style="flex: 1; overflow-y: auto; padding-right: 8px;">
            </div>
        `;
        
        this.galleryContainer.appendChild(panel);
        this.historyPanel = panel;
    }

    _createControlBar() {
        const bar = document.createElement('div');
        bar.id = 'gallery-control-bar';
        bar.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 20;
            pointer-events: auto;
        `;
        
        const closeBtn = this._createControlButton('✕ 关闭', () => this._notify('close'));
        closeBtn.style.background = 'rgba(255,69,0,0.1)';
        closeBtn.style.borderColor = '#ff4500';
        closeBtn.style.color = '#ff4500';
        
        const layoutBtn = this._createControlButton('🔄 切换布局', () => this._notify('layoutChange'));
        const historyBtn = this._createControlButton('📜 历史记录', () => this._toggleHistory());
        
        bar.appendChild(historyBtn);
        bar.appendChild(layoutBtn);
        bar.appendChild(closeBtn);
        
        this.galleryContainer.appendChild(bar);
        
        this.closeBtn = closeBtn;
        this.layoutBtn = layoutBtn;
        this.historyBtn = historyBtn;
    }

    _createControlButton(text, onClick) {
        const btn = document.createElement('button');
        btn.style.cssText = `
            padding: 12px 24px;
            background: rgba(255,215,0,0.1);
            border: 1px solid rgba(255,215,0,0.4);
            color: #ffd700;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-family: 'Outfit', sans-serif;
            transition: all 0.3s;
            letter-spacing: 1px;
        `;
        btn.textContent = text;
        
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255,215,0,0.2)';
            btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,215,0,0.1)';
            btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', onClick);
        
        return btn;
    }

    _toggleHistory() {
        this.isHistoryOpen = !this.isHistoryOpen;
        
        if (this.isHistoryOpen) {
            this.historyPanel.style.transform = 'translateY(-50%) translateX(0)';
            this.historyPanel.style.opacity = '1';
            this.historyBtn.style.background = 'rgba(255,215,0,0.3)';
        } else {
            this.historyPanel.style.transform = 'translateY(-50%) translateX(-100%)';
            this.historyPanel.style.opacity = '0';
            this.historyBtn.style.background = 'rgba(255,215,0,0.1)';
        }
    }

    showDetailPanel(cardData) {
        this.currentCard = cardData;
        this._updateCardDetail(cardData);
        
        this.detailPanel.style.transform = 'translateY(-50%) translateX(0)';
        this.detailPanel.style.opacity = '1';
    }

    hideDetailPanel() {
        this.currentCard = null;
        this.detailPanel.style.transform = 'translateY(-50%) translateX(100%)';
        this.detailPanel.style.opacity = '0';
    }

    _updateCardDetail(cardData) {
        const stats = collectionManager.getCardStats(cardData.id);
        
        this.detailPanel.querySelector('#detail-card-name').textContent = cardData.name;
        this.detailPanel.querySelector('#detail-up-meaning').textContent = cardData.up;
        this.detailPanel.querySelector('#detail-rev-meaning').textContent = cardData.rev;
        
        if (stats) {
            this.detailPanel.querySelector('#stat-total').textContent = stats.drawCount;
            this.detailPanel.querySelector('#stat-up').textContent = stats.upCount;
            this.detailPanel.querySelector('#stat-rev').textContent = stats.revCount;
            this.detailPanel.querySelector('#stat-up-rate').textContent = Math.round(stats.upRate * 100) + '%';
            this.detailPanel.querySelector('#first-draw').textContent = this._formatDate(stats.firstDrawAt);
        } else {
            this.detailPanel.querySelector('#stat-total').textContent = '0';
            this.detailPanel.querySelector('#stat-up').textContent = '0';
            this.detailPanel.querySelector('#stat-rev').textContent = '0';
            this.detailPanel.querySelector('#stat-up-rate').textContent = '-';
            this.detailPanel.querySelector('#first-draw').textContent = '-';
        }
    }

    _updateStats() {
        const unlockedCount = document.getElementById('unlocked-count');
        const totalDraws = document.getElementById('total-draws');
        const historyCount = document.getElementById('history-count');
        
        if (unlockedCount) unlockedCount.textContent = collectionManager.getTotalUnlocked();
        if (totalDraws) totalDraws.textContent = collectionManager.getTotalDraws();
        if (historyCount) historyCount.textContent = collectionManager.getTotalDraws();
        
        this._updateHistoryList();
    }

    _updateHistoryList() {
        const container = document.getElementById('history-list-container');
        if (!container) return;
        
        const history = collectionManager.getRecentHistory(50);
        
        if (history.length === 0) {
            container.innerHTML = '<div style="color: #666; text-align: center; padding: 40px 0; font-size: 14px;">暂无抽取记录</div>';
            return;
        }
        
        container.innerHTML = history.map(entry => `
            <div style="
                padding: 10px 12px;
                margin-bottom: 8px;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span style="color: #ccc; font-size: 13px;">${entry.cardName}</span>
                <span style="
                    font-size: 10px;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    ${entry.isReversed ? 
                        'color: #ff4500; border: 1px solid #ff4500;' : 
                        'color: #ffd700; border: 1px solid #ffd700;'}
                ">${entry.isReversed ? '逆位' : '正位'}</span>
            </div>
        `).join('');
    }

    _formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    show() {
        this.galleryContainer.style.display = 'block';
        requestAnimationFrame(() => {
            this.galleryContainer.style.opacity = '1';
        });
        this._updateStats();
        this._updateHistoryList();
    }

    hide() {
        this.galleryContainer.style.opacity = '0';
        setTimeout(() => {
            this.galleryContainer.style.display = 'none';
        }, 300);
        this.hideDetailPanel();
        if (this.isHistoryOpen) {
            this._toggleHistory();
        }
    }

    updateLayoutButton(layoutType) {
        const labels = {
            [LayoutType.GRID]: '🔲 网格布局',
            [LayoutType.SPIRAL]: '🌀 螺旋布局',
            [LayoutType.RING]: '💫 环形布局'
        };
        this.layoutBtn.textContent = labels[layoutType] || '🔄 切换布局';
    }

    getCanvasContainer() {
        return this.canvasContainer;
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].add(callback);
            return () => this.listeners[event].delete(callback);
        }
    }

    _notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

export const galleryUIManager = new GalleryUIManager();
