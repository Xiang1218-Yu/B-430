import * as THREE from 'three';

class CardViewer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cardMesh = null;
    this.isActive = false;
    this.isDragging = false;
    this.autoRotate = true;
    this.rotationSpeed = 0.005;
    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.currentRotationY = 0;
    this.currentRotationX = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.cardData = null;

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._dragStart = { x: 0, y: 0 };
    this._animationId = null;

    this._init();
  }

  _init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this._setupLights();
    this._setupEventListeners();

    window.addEventListener('resize', () => this._onResize());
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffd700, 1.5);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466ff, 0.5);
    fillLight.position.set(-5, 0, 3);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffd700, 0.8, 15);
    rimLight.position.set(0, 3, -5);
    this.scene.add(rimLight);

    this._createParticles();
  }

  _createParticles() {
    const count = 200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });

    this._particles = new THREE.Points(geom, mat);
    this.scene.add(this._particles);
  }

  _setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    canvas.addEventListener('mouseup', () => this._onMouseUp());
    canvas.addEventListener('mouseleave', () => this._onMouseUp());
    canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', () => this._onMouseUp());
  }

  _onMouseDown(e) {
    this.isDragging = true;
    this.autoRotate = false;
    this._dragStart.x = e.clientX;
    this._dragStart.y = e.clientY;
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this._dragStart.x;
    const deltaY = e.clientY - this._dragStart.y;

    this.targetRotationY += deltaX * 0.01;
    this.targetRotationX += deltaY * 0.01;
    this.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotationX));

    this._dragStart.x = e.clientX;
    this._dragStart.y = e.clientY;
  }

  _onMouseUp() {
    this.isDragging = false;
    setTimeout(() => {
      this.autoRotate = true;
    }, 3000);
  }

  _onWheel(e) {
    e.preventDefault();
    this.targetZoom += e.deltaY * 0.001;
    this.targetZoom = Math.max(0.5, Math.min(2.5, this.targetZoom));
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.autoRotate = false;
      this._dragStart.x = e.touches[0].clientX;
      this._dragStart.y = e.touches[0].clientY;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this._dragStart.x;
    const deltaY = e.touches[0].clientY - this._dragStart.y;

    this.targetRotationY += deltaX * 0.01;
    this.targetRotationX += deltaY * 0.01;
    this.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotationX));

    this._dragStart.x = e.touches[0].clientX;
    this._dragStart.y = e.touches[0].clientY;
  }

  _onResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  setCard(mesh, cardData) {
    if (this.cardMesh) {
      this.scene.remove(this.cardMesh);
      this.cardMesh.geometry.dispose();
      this.cardMesh.material.forEach(m => m.dispose());
    }

    this.cardData = cardData;

    const newMesh = mesh.clone();
    newMesh.scale.set(1.5, 1.5, 1.5);
    newMesh.position.set(0, 0, 0);
    newMesh.rotation.set(0, 0, 0);
    this.cardMesh = newMesh;
    this.scene.add(this.cardMesh);

    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.currentRotationY = 0;
    this.currentRotationX = 0;
    this.targetZoom = 1;
    this.zoom = 1;
    this.autoRotate = true;
  }

  show() {
    this.isActive = true;
    this.container.style.display = 'flex';
    if (!this._animationId) {
      this._animate();
    }
  }

  hide() {
    this.isActive = false;
    this.container.style.display = 'none';
  }

  _animate() {
    this._animationId = requestAnimationFrame(() => this._animate());

    if (this.autoRotate && !this.isDragging) {
      this.targetRotationY += this.rotationSpeed;
    }

    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.1;
    this.zoom += (this.targetZoom - this.zoom) * 0.1;

    if (this.cardMesh) {
      this.cardMesh.rotation.y = this.currentRotationY;
      this.cardMesh.rotation.x = this.currentRotationX;
      this.cardMesh.scale.setScalar(1.5 * this.zoom);
    }

    if (this._particles) {
      this._particles.rotation.y += 0.0005;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
    }
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export { CardViewer };
