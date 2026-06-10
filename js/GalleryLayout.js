class GalleryLayout {
  static get LAYOUT_GRID() { return 'grid'; }
  static get LAYOUT_SPIRAL() { return 'spiral'; }
  static get LAYOUT_RING() { return 'ring'; }

  static calculateGridPositions(count, options = {}) {
    const {
      cols = 5,
      spacingX = 2.0,
      spacingY = 3.2,
      centerX = 0,
      centerY = 0
    } = options;

    const positions = [];
    const rows = Math.ceil(count / cols);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const totalWidth = (cols - 1) * spacingX;
      const totalHeight = (rows - 1) * spacingY;

      positions.push({
        x: centerX + col * spacingX - totalWidth / 2,
        y: centerY - row * spacingY + totalHeight / 2,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1
      });
    }

    return positions;
  }

  static calculateSpiralPositions(count, options = {}) {
    const {
      startRadius = 2,
      endRadius = 12,
      startAngle = 0,
      totalRotations = 2.5,
      heightRange = 8,
      centerY = 0
    } = options;

    const positions = [];

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const radius = startRadius + (endRadius - startRadius) * t;
      const angle = startAngle + t * totalRotations * Math.PI * 2;
      const y = centerY + heightRange * (0.5 - t);

      positions.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        rotationX: 0,
        rotationY: -angle + Math.PI / 2,
        rotationZ: 0,
        scale: 1
      });
    }

    return positions;
  }

  static calculateRingPositions(count, options = {}) {
    const {
      radius = 8,
      centerY = 0,
      tiltX = 0.15,
      startAngle = 0
    } = options;

    const positions = [];
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;

      positions.push({
        x: Math.cos(angle) * radius,
        y: centerY,
        z: Math.sin(angle) * radius,
        rotationX: tiltX,
        rotationY: -angle + Math.PI / 2,
        rotationZ: 0,
        scale: 1
      });
    }

    return positions;
  }

  static calculatePositions(count, layoutType, options = {}) {
    switch (layoutType) {
      case this.LAYOUT_SPIRAL:
        return this.calculateSpiralPositions(count, options);
      case this.LAYOUT_RING:
        return this.calculateRingPositions(count, options);
      case this.LAYOUT_GRID:
      default:
        return this.calculateGridPositions(count, options);
    }
  }

  static animateToPosition(mesh, targetPos, duration = 800, delay = 0) {
    return new Promise((resolve) => {
      const startPos = {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z,
        rx: mesh.rotation.x,
        ry: mesh.rotation.y,
        rz: mesh.rotation.z,
        sx: mesh.scale.x,
        sy: mesh.scale.y,
        sz: mesh.scale.z
      };

      const startTime = performance.now() + delay;

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animate() {
        const now = performance.now();
        const elapsed = now - startTime;

        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }

        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        mesh.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
        mesh.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
        mesh.position.z = startPos.z + (targetPos.z - startPos.z) * eased;

        mesh.rotation.x = startPos.rx + (targetPos.rotationX - startPos.rx) * eased;
        mesh.rotation.y = startPos.ry + (targetPos.rotationY - startPos.ry) * eased;
        mesh.rotation.z = startPos.rz + (targetPos.rotationZ - startPos.rz) * eased;

        const targetScale = targetPos.scale || 1;
        mesh.scale.x = startPos.sx + (targetScale - startPos.sx) * eased;
        mesh.scale.y = startPos.sy + (targetScale - startPos.sy) * eased;
        mesh.scale.z = startPos.sz + (targetScale - startPos.sz) * eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }

      animate();
    });
  }

  static applyPositionsInstant(meshes, positions) {
    meshes.forEach((mesh, i) => {
      if (positions[i]) {
        mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
        mesh.rotation.set(positions[i].rotationX, positions[i].rotationY, positions[i].rotationZ);
        const scale = positions[i].scale || 1;
        mesh.scale.set(scale, scale, scale);
      }
    });
  }
}

export { GalleryLayout };
