import * as THREE from 'three';

class CardFactory {
  constructor() {
    this.textureCache = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.assetsConfig = {
      baseUrl: 'https://raw.githubusercontent.com/ekelen/tarot/master/images/cards/'
    };
  }

  getCardImageUrl(cardId) {
    let fileName = cardId;
    if (cardId.startsWith('m')) {
      fileName = cardId.substring(1);
    }
    return `${this.assetsConfig.baseUrl}${fileName}.jpg`;
  }

  generateProceduralTexture(cardData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 896;
    const ctx = canvas.getContext('2d');

    const suiteColor = {
      'm': '#1a1a2e',
      'w': '#2e1a1a',
      'c': '#1a2e2e',
      's': '#2e2e2e',
      'p': '#2e2a1a'
    }[cardData.id[0]] || '#050507';

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#101015');
    grad.addColorStop(0.5, suiteColor);
    grad.addColorStop(1, '#101015');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';

    ctx.font = 'bold 44px "Outfit"';
    ctx.fillText(cardData.name, canvas.width / 2, canvas.height * 0.85);

    ctx.font = '120px "Outfit"';
    const symbols = { 'm': '✨', 'w': '🔥', 'c': '🌊', 's': '⚔️', 'p': '🪙' };
    ctx.fillText(symbols[cardData.id[0]] || '🔮', canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '24px "Outfit"';
    ctx.fillText(cardData.id.toUpperCase(), canvas.width / 2, 70);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  generateBackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 896;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, 512, 896);

    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.random();
      ctx.fillRect(Math.random() * 512, Math.random() * 896, 2, 2);
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 472, 856);

    ctx.beginPath();
    ctx.arc(256, 448, 120, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  async loadCardTexture(cardId, cardData) {
    if (this.textureCache.has(cardId)) {
      return this.textureCache.get(cardId);
    }

    return new Promise((resolve) => {
      const url = this.getCardImageUrl(cardId);
      this.textureLoader.load(
        url,
        (tex) => {
          tex.anisotropy = 16;
          tex.colorSpace = THREE.SRGBColorSpace;
          this.textureCache.set(cardId, tex);
          resolve(tex);
        },
        undefined,
        () => {
          console.warn(`Failed to load texture for ${cardId}, using procedural.`);
          const tex = this.generateProceduralTexture(cardData);
          this.textureCache.set(cardId, tex);
          resolve(tex);
        }
      );
    });
  }

  async createCardMesh(cardData, options = {}) {
    const {
      width = 1.2,
      height = 2.1,
      depth = 0.06,
      locked = false,
      showBack = false
    } = options;

    const group = new THREE.Group();

    const geom = new THREE.BoxGeometry(width, height, depth);

    let frontTex;
    if (locked) {
      frontTex = this.generateBackTexture();
    } else {
      frontTex = await this.loadCardTexture(cardData.id, cardData);
    }

    const backTex = this.generateBackTexture();

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: locked ? 0x333333 : 0x221a0a,
      metalness: 0.8,
      roughness: 0.2
    });

    const mats = [
      goldMaterial.clone(),
      goldMaterial.clone(),
      goldMaterial.clone(),
      goldMaterial.clone(),
      new THREE.MeshStandardMaterial({
        map: showBack ? backTex : frontTex,
        roughness: 0.1,
        metalness: 0.2
      }),
      new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.3
      })
    ];

    const mesh = new THREE.Mesh(geom, mats);
    group.add(mesh);

    if (!locked) {
      const borderWidth = width + 0.08;
      const borderHeight = height + 0.08;
      const borderDepth = depth + 0.04;
      const borderGeom = new THREE.BoxGeometry(borderWidth, borderHeight, borderDepth);
      
      const borderMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
        metalness: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      
      const borderMesh = new THREE.Mesh(borderGeom, borderMat);
      borderMesh.position.z = -0.02;
      group.add(borderMesh);
      group.userData.borderMesh = borderMesh;

      const gemGeom = new THREE.OctahedronGeometry(0.12, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 1.0,
        metalness: 1.0,
        roughness: 0.0
      });
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.set(0, height / 2 - 0.05, depth / 2 + 0.05);
      group.add(gem);
      group.userData.gemMesh = gem;

      const glowGeom = new THREE.PlaneGeometry(width * 1.3, height * 1.3);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.z = -depth / 2 - 0.01;
      group.add(glow);
      group.userData.glowMesh = glow;

      const pointLight = new THREE.PointLight(0xffd700, 0.5, 3);
      pointLight.position.set(0, 0, 1);
      group.add(pointLight);
      group.userData.glowLight = pointLight;
    }

    group.userData = {
      ...group.userData,
      cardId: cardData.id,
      cardData: cardData,
      locked,
      cardMesh: mesh,
      originalMaterials: mats,
      originalScale: 1
    };

    return group;
  }

  createLockIndicator(cardData) {
    const group = new THREE.Group();

    const ringGeom = new THREE.TorusGeometry(0.3, 0.03, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.3
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const lockGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
    const lockMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.4
    });
    const lock = new THREE.Mesh(lockGeom, lockMat);
    lock.position.y = 0.05;
    group.add(lock);

    return group;
  }
}

export { CardFactory };
