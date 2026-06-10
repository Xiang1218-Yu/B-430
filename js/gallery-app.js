import { GalleryController } from './gallery-controller.js';
import { galleryUIManager } from './gallery-ui-manager.js';
import { collectionManager } from './collection-manager.js';
import { LayoutType } from './layout-manager.js';

export class GalleryApp {
    constructor() {
        this.controller = null;
        this.uiManager = galleryUIManager;
        this.isOpen = false;
        
        this._bindEvents();
    }

    _bindEvents() {
        this.uiManager.on('open', () => this.open());
        this.uiManager.on('close', () => this.close());
        this.uiManager.on('layoutChange', () => this._cycleLayout());
        this.uiManager.on('closeDetail', () => this._closeDetail());
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.uiManager.show();
        
        const canvasContainer = this.uiManager.getCanvasContainer();
        
        if (!this.controller) {
            this.controller = new GalleryController(canvasContainer);
            
            this.controller.on('cardSelect', (cardData) => {
                this._onCardSelect(cardData);
            });
            
            this.controller.on('closeDetail', () => {
                this.uiManager.hideDetailPanel();
            });
        }
        
        this.controller.show();
        this.controller.applyLayout(LayoutType.GRID);
        this.uiManager.updateLayoutButton(LayoutType.GRID);
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        if (this.controller) {
            this.controller.hide();
        }
        
        this.uiManager.hide();
    }

    _onCardSelect(cardData) {
        this.uiManager.showDetailPanel(cardData);
    }

    _closeDetail() {
        if (this.controller) {
            this.controller.closeDetail();
        }
    }

    _cycleLayout() {
        if (!this.controller) return;
        
        const nextLayout = this.controller.nextLayout();
        this.uiManager.updateLayoutButton(nextLayout);
    }

    refresh() {
        if (this.controller) {
            this.controller.refresh();
        }
    }

    addDraw(cardData, isReversed) {
        return collectionManager.addDraw(cardData, isReversed);
    }

    getCollectionManager() {
        return collectionManager;
    }
}

export const galleryApp = new GalleryApp();
