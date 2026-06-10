import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CardViewer {
  constructor(container, textureLoaderFn, proceduralTextureFn) {
    this.container = container;
    this.loadCardTexture = textureLoaderFn;
    this.generateProceduralTexture = proceduralTextureFn;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cardMesh = null;
    this.cardData = null;
    this.animationId = null;
    this.isActive = false;
    this._onClose = null;
  }

  async open(cardData, onClose) {
    if (this.isActive) return;
    this.isActive = true;
    this.cardData = cardData;
    this._onClose = onClose;

    this._initScene();
    await this._createCard(cardData);
    this._createLighting();
    this._createControls();
    this._startLoop();
  }

  close() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
      this.renderer = null;
    }

    if (this.scene) {
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.scene = null;
    }

    this.cardMesh = null;
    if (this._onClose) this._onClose();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050507);

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  async _createCard(data) {
    const geom = new THREE.BoxGeometry(2.4, 4.2, 0.12);

    let frontTex;
    try {
      frontTex = await this.loadCardTexture(data);
    } catch (e) {
      frontTex = this.generateProceduralTexture(data);
    }

    const backCanvas = document.createElement('canvas');
    backCanvas.width = 512;
    backCanvas.height = 896;
    const bCtx = backCanvas.getContext('2d');
    bCtx.fillStyle = '#050507';
    bCtx.fillRect(0, 0, 512, 896);
    for (let i = 0; i < 300; i++) {
      bCtx.fillStyle = '#ffffff';
      bCtx.globalAlpha = Math.random();
      bCtx.fillRect(Math.random() * 512, Math.random() * 896, 2, 2);
    }
    bCtx.globalAlpha = 1;
    bCtx.strokeStyle = '#ffd700';
    bCtx.lineWidth = 10;
    bCtx.strokeRect(20, 20, 472, 856);
    const backTex = new THREE.CanvasTexture(backCanvas);

    const mats = [
      new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x221a0a, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.1, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.3 })
    ];

    this.cardMesh = new THREE.Mesh(geom, mats);
    this.scene.add(this.cardMesh);
  }

  _createLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(amb);

    const spot = new THREE.SpotLight(0xffd700, 800);
    spot.position.set(3, 8, 6);
    spot.angle = Math.PI / 6;
    spot.penumbra = 0.5;
    this.scene.add(spot);

    const rim = new THREE.PointLight(0x4488ff, 30, 20);
    rim.position.set(-5, 2, -3);
    this.scene.add(rim);
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0, 0);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 2;
  }

  _startLoop() {
    const loop = () => {
      if (!this.isActive) return;
      this.animationId = requestAnimationFrame(loop);

      if (this.cardMesh) {
        const time = Date.now() * 0.001;
        this.cardMesh.position.y = Math.sin(time) * 0.1;
      }

      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  destroy() {
    this.close();
    window.removeEventListener('resize', this._resizeHandler);
  }
}
