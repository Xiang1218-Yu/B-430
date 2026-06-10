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
    const cardArcWidth = opts.cardArcWidth || 3.0;
    const positions = [];

    let angle = 0;
    let radius = 4;

    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
        rotY: -angle + Math.PI,
        rotX: 0
      });

      const arcStep = cardArcWidth / Math.max(radius, 1);
      angle += arcStep;
      radius += arcStep * 0.5;
    }

    return positions;
  }

  static _ring(count, opts) {
    const cardWidth = opts.cardWidth || 2.5;
    const ringGap = opts.ringGap || 4.0;
    const positions = [];

    let remaining = count;
    let ringIndex = 0;

    while (remaining > 0) {
      const radius = ringIndex === 0 ? 0 : ringIndex * ringGap;
      let inThisRing;

      if (ringIndex === 0) {
        inThisRing = Math.min(1, remaining);
      } else {
        const circumference = 2 * Math.PI * radius;
        inThisRing = Math.min(Math.floor(circumference / cardWidth), remaining);
      }

      for (let i = 0; i < inThisRing; i++) {
        if (ringIndex === 0) {
          positions.push({
            x: 0,
            y: 0,
            z: 0,
            rotY: 0,
            rotX: 0
          });
        } else {
          const angle = (i / inThisRing) * Math.PI * 2 - Math.PI / 2;
          positions.push({
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius,
            rotY: -angle + Math.PI,
            rotX: 0
          });
        }
      }

      remaining -= inThisRing;
      ringIndex++;
    }

    return positions;
  }

  static getCameraPosition(layoutType, cardCount) {
    const extent = Math.max(cardCount * 0.5, 8);
    switch (layoutType) {
      case this.GRID:
        return { x: 0, y: 0, z: extent + 8 };
      case this.SPIRAL:
        return { x: 0, y: extent * 0.6, z: extent + 5 };
      case this.RING:
        return { x: 0, y: extent * 0.8, z: extent + 3 };
      default:
        return { x: 0, y: 0, z: extent + 8 };
    }
  }
}
