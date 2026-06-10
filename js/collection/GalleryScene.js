import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GalleryLayout } from './GalleryLayout.js';

export class GalleryScene {
  constructor(container, textureLoaderFn, proceduralTextureFn) {
    this.container = container;
    this.loadCardTexture = textureLoaderFn;
    this.generateProceduralTexture = proceduralTextureFn;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.cardMeshes = [];
    this.currentLayout = GalleryLayout.GRID;
    this.animationId = null;
    this.isActive = false;
    this._onCardClick = null;
    this._hoveredMesh = null;
    this._textureLoader = new THREE.TextureLoader();
  }

  async open(cards, layoutType, onCardClick) {
    if (this.isActive) return;
    this.isActive = true;
    this.currentLayout = layoutType;
    this._onCardClick = onCardClick;

    this._initScene();
    this._createLighting();
    this._createEnvironment();
    this._createControls();
    await this._createCards(cards, layoutType);
    this._bindEvents();
    this._startLoop();
  }

  close() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this._unbindEvents();

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    if (this.scene) {
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      this.scene = null;
    }

    this.cardMeshes = [];
    this._hoveredMesh = null;
  }

  async switchLayout(cards, layoutType) {
    if (!this.isActive) return;
    this.currentLayout = layoutType;

    const positions = GalleryLayout.calculate(layoutType, cards.length);
    const camPos = GalleryLayout.getCameraPosition(layoutType, cards.length);

    this._animateCamera(camPos);

    for (let i = 0; i < this.cardMeshes.length; i++) {
      if (i < positions.length) {
        const mesh = this.cardMeshes[i];
        const target = positions[i];
        mesh.userData.targetPos = target;
        this._animateCardTo(mesh, target);
      }
    }
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050507);
    this.scene.fog = new THREE.FogExp2(0x050507, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      500
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this._resizeHandler = () => this._onResize();
    window.addEventListener('resize', this._resizeHandler);
  }

  _onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  _createLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(amb);

    const spot = new THREE.SpotLight(0xffd700, 1000);
    spot.position.set(10, 20, 10);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.6;
    spot.castShadow = true;
    this.scene.add(spot);

    const fill = new THREE.PointLight(0x4466ff, 40, 60);
    fill.position.set(-10, 5, -10);
    this.scene.add(fill);
  }

  _createEnvironment() {
    const grid = new THREE.GridHelper(80, 80, 0x333333, 0x1a1a1a);
    grid.position.y = -5;
    this.scene.add(grid);

    const particleCount = 500;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particles = new THREE.Points(geom, mat);
    this.scene.add(particles);
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 60;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;
  }

  async _createCards(cards, layoutType) {
    const positions = GalleryLayout.calculate(layoutType, cards.length);
    const camPos = GalleryLayout.getCameraPosition(layoutType, cards.length);
    this.camera.position.set(camPos.x, camPos.y, camPos.z);
    this.controls.target.set(0, 0, 0);

    for (let i = 0; i < cards.length; i++) {
      const cardData = cards[i];
      const pos = positions[i];

      const geom = new THREE.BoxGeometry(2.0, 3.5, 0.08);

      let frontTex;
      try {
        frontTex = await this.loadCardTexture(cardData);
      } catch (e) {
        frontTex = this.generateProceduralTexture(cardData);
      }

      const backCanvas = document.createElement('canvas');
      backCanvas.width = 256;
      backCanvas.height = 448;
      const bCtx = backCanvas.getContext('2d');
      bCtx.fillStyle = '#050507';
      bCtx.fillRect(0, 0, 256, 448);
      for (let s = 0; s < 150; s++) {
        bCtx.fillStyle = '#ffffff';
        bCtx.globalAlpha = Math.random();
        bCtx.fillRect(Math.random() * 256, Math.random() * 448, 1, 1);
      }
      bCtx.globalAlpha = 1;
      bCtx.strokeStyle = '#ffd700';
      bCtx.lineWidth = 5;
      bCtx.strokeRect(10, 10, 236, 428);
      const backTex = new THREE.CanvasTexture(backCanvas);

      const mats = [
        new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.1, metalness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.3 })
      ];

      const mesh = new THREE.Mesh(geom, mats);
      mesh.position.set(pos.x, pos.y - 20, pos.z);
      mesh.rotation.y = pos.rotY;
      mesh.userData = { cardData, targetPos: pos, index: i };
      this.scene.add(mesh);
      this.cardMeshes.push(mesh);

      this._animateCardTo(mesh, pos, 800 + i * 60);
    }
  }

  _animateCardTo(mesh, target, delay = 0) {
    const startPos = mesh.position.clone();
    const startRotY = mesh.rotation.y;
    const startTime = Date.now() + delay;
    const duration = 800;

    const tick = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      mesh.position.lerpVectors(startPos, new THREE.Vector3(target.x, target.y, target.z), ease);
      mesh.rotation.y = THREE.MathUtils.lerp(startRotY, target.rotY, ease);

      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  _animateCamera(targetPos) {
    const startPos = this.camera.position.clone();
    const duration = 1000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(
        startPos,
        new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
        ease
      );
      this.controls.target.set(0, 0, 0);

      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  _bindEvents() {
    this._clickHandler = (e) => this._onClick(e);
    this._moveHandler = (e) => this._onMouseMove(e);
    this.renderer.domElement.addEventListener('click', this._clickHandler);
    this.renderer.domElement.addEventListener('mousemove', this._moveHandler);
  }

  _unbindEvents() {
    if (this._clickHandler) {
      window.removeEventListener('click', this._clickHandler);
    }
    if (this._moveHandler) {
      window.removeEventListener('mousemove', this._moveHandler);
    }
    window.removeEventListener('resize', this._resizeHandler);
  }

  _onClick(e) {
    if (!this.isActive) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cardMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      if (this._onCardClick && mesh.userData.cardData) {
        this._onCardClick(mesh.userData.cardData);
      }
    }
  }

  _onMouseMove(e) {
    if (!this.isActive) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cardMeshes);

    if (this._hoveredMesh && this._hoveredMesh !== (intersects[0]?.object || null)) {
      this._hoveredMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.3);
      this._hoveredMesh = null;
      this.renderer.domElement.style.cursor = 'default';
    }

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      if (mesh !== this._hoveredMesh) {
        this._hoveredMesh = mesh;
        this.renderer.domElement.style.cursor = 'pointer';
      }
      mesh.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.2);
    }
  }

  _startLoop() {
    const loop = () => {
      if (!this.isActive) return;
      this.animationId = requestAnimationFrame(loop);

      const time = Date.now() * 0.001;
      for (const mesh of this.cardMeshes) {
        if (mesh !== this._hoveredMesh) {
          mesh.position.y += Math.sin(time + mesh.userData.index * 0.5) * 0.001;
        }
      }

      if (this._hoveredMesh && this._hoveredMesh !== this.cardMeshes.find(m => m === this._hoveredMesh)) {
        this._hoveredMesh = null;
      }

      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }
}
