export class GalleryLayout {
  static GRID = 'grid';
  static SPIRAL = 'spiral';
  static RING = 'ring';

  static calculate(layoutType, cardCount, options = {}) {
    switch (layoutType) {
      case this.GRID:
        return this._grid(cardCount, options);
      case this.SPIRAL:
        return this._spiral(cardCount, options);
      case this.RING:
        return this._ring(cardCount, options);
      default:
        return this._grid(cardCount, options);
    }
  }

  static _grid(count, opts) {
    const cols = opts.cols || 6;
    const spacingX = opts.spacingX || 3.2;
    const spacingY = opts.spacingY || 5.0;
    const positions = [];

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const totalRows = Math.ceil(count / cols);
      positions.push({
        x: (col - (cols - 1) / 2) * spacingX,
        y: (totalRows - 1 - row - (totalRows - 1) / 2) * spacingY,
        z: 0,
        rotY: 0,
        rotX: 0
      });
    }

    return positions;
  }

  static _spiral(count, opts) {
    const turns = opts.turns || 3;
    const radiusGrowth = opts.radiusGrowth || 0.4;
    const heightGrowth = opts.heightGrowth || 0.6;
    const positions = [];

    for (let i = 0; i < count; i++) {
      const t = i / Math.max(count - 1, 1);
      const angle = t * turns * Math.PI * 2;
      const radius = 2 + t * radiusGrowth * count * 0.3;
      const y = t * heightGrowth * count * 0.3 - (heightGrowth * count * 0.15);

      positions.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        rotY: -angle + Math.PI,
        rotX: 0
      });
    }

    return positions;
  }

  static _ring(count, opts) {
    const rings = opts.rings || 3;
    const baseRadius = opts.baseRadius || 5;
    const radiusStep = opts.radiusStep || 4;
    const positions = [];

    let placed = 0;
    for (let ring = 0; ring < rings && placed < count; ring++) {
      const radius = baseRadius + ring * radiusStep;
      const maxInRing = ring === 0 ? 1 : Math.floor(2 * Math.PI * radius / 3.2);
      const inThisRing = Math.min(maxInRing, count - placed);

      for (let i = 0; i < inThisRing; i++) {
        const angle = (i / inThisRing) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: Math.cos(angle) * radius,
          y: ring * 0.5,
          z: Math.sin(angle) * radius,
          rotY: -angle + Math.PI,
          rotX: 0
        });
        placed++;
      }
    }

    return positions;
  }

  static getCameraPosition(layoutType, cardCount) {
    const extent = Math.max(cardCount * 0.3, 8);
    switch (layoutType) {
      case this.GRID:
        return { x: 0, y: 0, z: extent + 8 };
      case this.SPIRAL:
        return { x: 0, y: extent * 0.3, z: extent + 5 };
      case this.RING:
        return { x: 0, y: extent * 0.5, z: extent + 5 };
      default:
        return { x: 0, y: 0, z: extent + 8 };
    }
  }
}
