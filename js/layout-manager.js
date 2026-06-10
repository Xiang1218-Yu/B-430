import * as THREE from 'three';

export const LayoutType = {
    GRID: 'grid',
    SPIRAL: 'spiral',
    RING: 'ring'
};

export class LayoutManager {
    constructor() {
        this.currentLayout = LayoutType.GRID;
        this.cardWidth = 2.4;
        this.cardHeight = 4.2;
        this.spacingX = 0.6;
        this.spacingY = 0.6;
    }

    setCardSize(width, height) {
        this.cardWidth = width;
        this.cardHeight = height;
    }

    setSpacing(spacingX, spacingY) {
        this.spacingX = spacingX;
        this.spacingY = spacingY;
    }

    calculatePositions(cards, layoutType = this.currentLayout) {
        this.currentLayout = layoutType;
        
        switch (layoutType) {
            case LayoutType.GRID:
                return this._gridLayout(cards);
            case LayoutType.SPIRAL:
                return this._spiralLayout(cards);
            case LayoutType.RING:
                return this._ringLayout(cards);
            default:
                return this._gridLayout(cards);
        }
    }

    _gridLayout(cards) {
        const positions = [];
        const count = cards.length;
        
        if (count === 0) return positions;

        const cols = Math.ceil(Math.sqrt(count * 1.6));
        const rows = Math.ceil(count / cols);
        
        const totalWidth = cols * (this.cardWidth + this.spacingX) - this.spacingX;
        const totalHeight = rows * (this.cardHeight + this.spacingY) - this.spacingY;
        
        const startX = -totalWidth / 2 + (this.cardWidth + this.spacingX) / 2;
        const startY = totalHeight / 2 - (this.cardHeight + this.spacingY) / 2;

        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = startX + col * (this.cardWidth + this.spacingX);
            const y = startY - row * (this.cardHeight + this.spacingY);
            const z = 0;
            
            positions.push({
                position: new THREE.Vector3(x, y, z),
                rotation: new THREE.Euler(0, 0, 0),
                scale: 1
            });
        }

        return positions;
    }

    _spiralLayout(cards) {
        const positions = [];
        const count = cards.length;
        
        if (count === 0) return positions;

        const turns = Math.max(2, Math.ceil(count / 10));
        const radiusStep = (this.cardWidth + this.spacingX) * 0.5;
        const startRadius = this.cardWidth * 0.8;
        
        for (let i = 0; i < count; i++) {
            const t = i / Math.max(count - 1, 1);
            const angle = t * turns * Math.PI * 2;
            const radius = startRadius + t * turns * radiusStep * 2;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.6 - (count * 0.05);
            const z = -i * 0.02;
            
            const rotationY = angle + Math.PI / 2;
            const rotationX = Math.sin(t * Math.PI) * 0.1;
            
            positions.push({
                position: new THREE.Vector3(x, y, z),
                rotation: new THREE.Euler(rotationX, rotationY, 0),
                scale: 1 - t * 0.15
            });
        }

        return positions;
    }

    _ringLayout(cards) {
        const positions = [];
        const count = cards.length;
        
        if (count === 0) return positions;

        const rings = Math.max(1, Math.ceil(count / 12));
        let cardIndex = 0;
        
        for (let ring = 0; ring < rings; ring++) {
            const ringRadius = (ring + 1) * (this.cardHeight + this.spacingY) * 1.2;
            const cardsInRing = Math.min(count - cardIndex, 8 + ring * 4);
            
            for (let i = 0; i < cardsInRing; i++) {
                const angle = (i / cardsInRing) * Math.PI * 2 - Math.PI / 2;
                
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius * 0.7;
                const z = -ring * 0.5;
                
                const rotationY = angle + Math.PI / 2;
                const tilt = Math.sin(angle) * 0.15;
                
                positions.push({
                    position: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(tilt, rotationY, 0),
                    scale: 0.85 + ring * 0.05
                });
                
                cardIndex++;
                if (cardIndex >= count) break;
            }
            
            if (cardIndex >= count) break;
        }

        return positions;
    }

    getCameraForLayout(layoutType, cardCount) {
        const baseDistance = 15;
        const scaleFactor = Math.max(1, Math.sqrt(cardCount) * 0.3);
        
        switch (layoutType) {
            case LayoutType.GRID:
                return {
                    position: new THREE.Vector3(0, 0, baseDistance * scaleFactor),
                    target: new THREE.Vector3(0, 0, 0)
                };
            case LayoutType.SPIRAL:
                return {
                    position: new THREE.Vector3(0, 2, baseDistance * scaleFactor * 1.2),
                    target: new THREE.Vector3(0, -1, 0)
                };
            case LayoutType.RING:
                return {
                    position: new THREE.Vector3(0, 5, baseDistance * scaleFactor * 1.5),
                    target: new THREE.Vector3(0, 0, -2)
                };
            default:
                return {
                    position: new THREE.Vector3(0, 0, baseDistance * scaleFactor),
                    target: new THREE.Vector3(0, 0, 0)
                };
        }
    }

    nextLayout() {
        const layouts = Object.values(LayoutType);
        const currentIndex = layouts.indexOf(this.currentLayout);
        const nextIndex = (currentIndex + 1) % layouts.length;
        return layouts[nextIndex];
    }
}

export const layoutManager = new LayoutManager();
