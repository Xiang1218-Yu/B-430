import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { StorageManager } from './StorageManager.js';
import { CardFactory } from './CardFactory.js';
import { GalleryLayout } from './GalleryLayout.js';
import { CardViewer } from './CardViewer.js';
import { GalleryUI } from './GalleryUI.js';

class TarotGallery {
  constructor(tarotDB) {
    this.tarotDB = tarotDB;
    this.isOpen = false;
    this.cardMeshes = [];
    this.hoveredCard = null;

    this.storage = new StorageManager();
    this.cardFactory = new CardFactory();

    this.ui = new GalleryUI({
      onOpenGallery: () => this.open(),
      onCloseGallery: () => this.close(),
      onLayoutChange: (layout) => this.changeLayout(layout),
      onCloseViewer: () => this.closeViewer()
    });

    this._initScene();
  }

  _initScene() {
    const container = this.ui.getGalleryContainer();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050507);
    this.scene.fog = new THREE.FogExp2(0x050507, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 2, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this._setupLights();
    this._setupEnvironment();
    this._setupControls();
    this._setupRaycaster();

    this.viewer = new CardViewer(this.ui.getViewerContainer());

    this._clock = new THREE.Clock();
    this._animate();

    window.addEventListener('resize', () => this._onResize());
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffd700, 1.2);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x4466aa, 0.5, 50);
    fillLight.position.set(-10, 5, 5);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffd700, 0.8, 30);
    rimLight.position.set(0, -5, -10);
    this.scene.add(rimLight);
  }

  _setupEnvironment() {
    const ringGeom = new THREE.TorusGeometry(12, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 1.5
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -4;
    this.scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(14, 0.04, 16, 100),
      new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        emissive: 0x4466aa,
        emissiveIntensity: 0.8
      })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -4;
    this.scene.add(ring2);

    this._createStarField();
  }

  _createStarField() {
    const count = 1000;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8
    });

    this._stars = new THREE.Points(geom, mat);
    this.scene.add(this._stars);
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.autoRotate = false;
    this.controls.enabled = false;
  }

  _setupRaycaster() {
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.renderer.domElement.addEventListener('click', (e) => this._onClick(e));
  }

  _findParentGroup(obj) {
    let current = obj;
    while (current) {
      if (current.userData && current.userData.cardData) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  _onMouseMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _onClick(e) {
    if (this.hoveredCard && !this.hoveredCard.userData.locked) {
      this.openCardViewer(this.hoveredCard);
    }
  }

  async _createGalleryCards() {
    this.cardMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    this.cardMeshes = [];

    const unlockedIds = new Set(this.storage.getUnlockedCardIds());

    for (let i = 0; i < this.tarotDB.length; i++) {
      const cardData = this.tarotDB[i];
      const isUnlocked = unlockedIds.has(cardData.id);

      const mesh = await this.cardFactory.createCardMesh(cardData, {
        width: 1.2,
        height: 2.1,
        depth: 0.08,
        locked: !isUnlocked
      });

      mesh.userData.originalScale = 1;
      mesh.userData.index = i;
      mesh.userData.isUnlocked = isUnlocked;

      this.cardMeshes.push(mesh);
      this.scene.add(mesh);
    }

    this._applyLayout(this.ui.currentLayout, false);
  }

  _applyLayout(layoutType, animated = true) {
    const unlockedCount = this.storage.getUnlockedCount();
    const totalCount = this.tarotDB.length;
    this.ui.updateStats(unlockedCount, totalCount);

    let positions;
    switch (layoutType) {
      case GalleryLayout.LAYOUT_SPIRAL:
        positions = GalleryLayout.calculateSpiralPositions(this.cardMeshes.length, {
          startRadius: 3,
          endRadius: 14,
          totalRotations: 2,
          heightRange: 8
        });
        break;
      case GalleryLayout.LAYOUT_RING:
        positions = GalleryLayout.calculateRingPositions(this.cardMeshes.length, {
          radius: 10,
          tiltX: 0.1
        });
        break;
      case GalleryLayout.LAYOUT_GRID:
      default:
        positions = GalleryLayout.calculateGridPositions(this.cardMeshes.length, {
          cols: 6,
          spacingX: 2.0,
          spacingY: 3.0
        });
    }

    this.cardMeshes.forEach((mesh, i) => {
      if (animated) {
        const delay = i * 30;
        GalleryLayout.animateToPosition(mesh, positions[i], 600, delay);
      } else {
        mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
        mesh.rotation.set(positions[i].rotationX, positions[i].rotationY, positions[i].rotationZ);
        const scale = mesh.userData.isUnlocked ? 1 : 0.8;
        mesh.scale.set(scale, scale, scale);
      }
    });
  }

  async open() {
    this.isOpen = true;
    this.controls.enabled = true;
    
    requestAnimationFrame(() => {
      this._onResize();
    });
    
    await this._createGalleryCards();
    this.ui.setLayout(this.ui.currentLayout);
  }

  close() {
    this.isOpen = false;
    this.controls.enabled = false;
    this.closeViewer();
  }

  changeLayout(layout) {
    this._applyLayout(layout, true);
  }

  openCardViewer(group) {
    const cardData = group.userData.cardData;
    const stats = this.storage.getCardStats(cardData.id);
    const history = this.storage.getDrawHistory(cardData.id, 20);

    this.ui.showCardDetails(cardData, stats, history);

    const cardMesh = group.userData.cardMesh;
    this.viewer.setCard(cardMesh, cardData);
    this.ui.showViewer();
    this.viewer.show();
  }

  closeViewer() {
    this.ui.hideViewer();
    this.viewer.hide();
  }

  recordDraw(cardId, isReversed) {
    this.storage.unlockCard(cardId, isReversed);
  }

  _updateHover() {
    if (!this.isOpen) return;

    this._raycaster.setFromCamera(this._mouse, this.camera);
    const allMeshes = [];
    this.cardMeshes.forEach(group => {
      group.traverse((child) => {
        if (child.isMesh) {
          allMeshes.push(child);
        }
      });
    });
    const intersects = this._raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const group = this._findParentGroup(intersects[0].object);
      if (group && this.hoveredCard !== group) {
        if (this.hoveredCard && !this.hoveredCard.userData.locked) {
          this.hoveredCard.scale.setScalar(this.hoveredCard.userData.originalScale);
        }
        this.hoveredCard = group;
        if (!group.userData.locked) {
          this.renderer.domElement.style.cursor = 'pointer';
        } else {
          this.renderer.domElement.style.cursor = 'not-allowed';
        }
      }
      if (group && !group.userData.locked) {
        group.scale.setScalar(group.userData.originalScale * 1.1);
      }
    } else {
      if (this.hoveredCard && !this.hoveredCard.userData.locked) {
        this.hoveredCard.scale.setScalar(this.hoveredCard.userData.originalScale);
      }
      this.hoveredCard = null;
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  _onResize() {
    const container = this.ui.getGalleryContainer();
    if (!container) return;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const time = this._clock.getElapsedTime();

    if (this._stars) {
      this._stars.rotation.y += 0.0001;
    }

    if (this.isOpen) {
      this._updateHover();
      this.controls.update();

      this.cardMeshes.forEach((group, i) => {
        if (group !== this.hoveredCard) {
          const floatOffset = i * 0.3;
          group.position.y += Math.sin(time * 1.5 + floatOffset) * 0.002;
        }

        if (!group.userData.locked) {
          const gem = group.userData.gemMesh;
          if (gem) {
            gem.rotation.y = time * 2;
            gem.rotation.x = Math.sin(time * 3) * 0.3;
          }

          const glow = group.userData.glowMesh;
          const border = group.userData.borderMesh;
          const glowLight = group.userData.glowLight;
          if (glow) {
            const pulse = 0.12 + Math.sin(time * 2 + i * 0.5) * 0.08;
            glow.material.opacity = pulse;
          }
          if (border) {
            const pulse = 0.25 + Math.sin(time * 2 + i * 0.5) * 0.1;
            border.material.emissiveIntensity = pulse;
          }
          if (glowLight) {
            const pulse = 0.3 + Math.sin(time * 2 + i * 0.5) * 0.2;
            glowLight.intensity = pulse;
          }
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  getUnlockedCount() {
    return this.storage.getUnlockedCount();
  }
}

export { TarotGallery };
