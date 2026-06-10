import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CardFactory } from './card-factory.js';
import { layoutManager, LayoutType } from './layout-manager.js';
import { collectionManager } from './collection-manager.js';

const TAROT_DB = [
    { id: "m00", name: "愚者", up: "新开始、自由、纯正", rev: "鲁莽、天真、消极" },
    { id: "m01", name: "魔术师", up: "意志、行动、创造力", rev: "操纵、计划不周、幻觉" },
    { id: "m02", name: "女祭司", up: "直觉、神秘、潜意识", rev: "秘密、脱节、沉默" },
    { id: "m03", name: "女皇", up: "丰产、自然、丰富", rev: "依赖、创造性封锁" },
    { id: "m04", name: "皇帝", up: "权威、结构、稳固", rev: "暴虐、僵化、傲慢" },
    { id: "m05", name: "教皇", up: "传统、信仰、精神指导", rev: "反叛、挑战现状" },
    { id: "m06", name: "恋人", up: "爱情、和谐、选择", rev: "失调、不平衡" },
    { id: "m07", name: "战车", up: "控制、意志、胜利", rev: "失控、缺乏方向" },
    { id: "m08", name: "力量", up: "勇气、耐性、同情", rev: "软弱、自我怀疑" },
    { id: "m09", name: "隐士", up: "独处、内省、指引", rev: "孤立、偏执、退缩" },
    { id: "m10", name: "命运之轮", up: "周期、变化、好运", rev: "倒霉、抗拒变化" },
    { id: "m11", name: "正义", up: "公正、诚实、因果", rev: "不公、逃避责任" },
    { id: "m12", name: "倒吊人", up: "暂停、放手、新视角", rev: "拖延、无谓牺牲" },
    { id: "m13", name: "死神", up: "终结、转变、新生", rev: "抗拒改变、停滞" },
    { id: "m14", name: "节制", up: "平衡、适度、融合", rev: "失衡、极端、冲突" },
    { id: "m15", name: "恶魔", up: "束缚、成瘾、物质主义", rev: "解脱、觉醒、力量" },
    { id: "m16", name: "塔", up: "剧变、破坏、启示", rev: "避免灾难、延迟崩溃" },
    { id: "m17", name: "星星", up: "希望、灵感、宁静", rev: "失望、困惑、缺乏信心" },
    { id: "m18", name: "月亮", up: "幻觉、恐惧、直觉", rev: "解除误解、克服恐惧" },
    { id: "m19", name: "太阳", up: "快乐、成功、生命力", rev: "消沉、虚假的乐观" },
    { id: "m20", name: "审判", up: "觉醒、重生、评判", rev: "自我怀疑、拒绝召唤" },
    { id: "m21", name: "世界", up: "圆满、成就、旅行", rev: "未竟之事、延误" }
];

export class GalleryController {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.cards = [];
        this.cardObjects = new Map();
        
        this.currentLayout = LayoutType.GRID;
        this.isDetailMode = false;
        this.detailCard = null;
        this.detailAutoRotate = true;
        this.detailRotateSpeed = 0.8;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredCard = null;
        this.isDragging = false;
        this._dragMoved = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.savedCameraPosition = new THREE.Vector3();
        this.savedCameraTarget = new THREE.Vector3();
        
        this.isVisible = false;
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        this.listeners = {
            cardSelect: new Set(),
            close: new Set()
        };
        
        this._init();
    }

    _init() {
        this._createScene();
        this._createLights();
        this._createControls();
        this._setupEventListeners();
    }

    _createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050507);
        this.scene.fog = new THREE.FogExp2(0x050507, 0.02);

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 20);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
    }

    _createLights() {
        const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambLight);

        const mainLight = new THREE.DirectionalLight(0xffd700, 1.5);
        mainLight.position.set(5, 10, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x4444ff, 0.5);
        fillLight.position.set(-5, -3, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.PointLight(0xffd700, 30, 30);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);
    }

    _createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 50;
        this.controls.enablePan = true;
    }

    _setupEventListeners() {
        window.addEventListener('resize', () => this._onResize());
        this.renderer.domElement.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this._onClick(e));
        this.renderer.domElement.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.renderer.domElement.addEventListener('mouseleave', (e) => this._onMouseUp(e));
    }

    _onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    _onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (this.isDetailMode && this.isDragging && this.detailCard) {
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;
            
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                this._dragMoved = true;
            }
            
            this.detailCard.mesh.rotation.y += deltaX * 0.01;
            this.detailCard.mesh.rotation.x += deltaY * 0.01;
            
            this.previousMousePosition.x = event.clientX;
            this.previousMousePosition.y = event.clientY;
            this.detailAutoRotate = false;
            return;
        }
        
        this._updateHover();
    }

    _onMouseDown(event) {
        if (this.isDetailMode && event.button === 0) {
            this.isDragging = true;
            this._dragMoved = false;
            this.previousMousePosition.x = event.clientX;
            this.previousMousePosition.y = event.clientY;
            this.renderer.domElement.style.cursor = 'grabbing';
        }
    }

    _onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.renderer.domElement.style.cursor = 'grab';
            
            if (this._dragMoved) {
                setTimeout(() => {
                    this.detailAutoRotate = true;
                }, 2000);
            }
        }
    }

    _onClick(event) {
        if (this.isDetailMode) {
            if (this._dragMoved) {
                this._dragMoved = false;
                return;
            }
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const meshes = [this.detailCard.mesh];
            const intersects = this.raycaster.intersectObjects(meshes);
            
            if (intersects.length === 0) {
                this.closeDetail();
                this._notify('closeDetail');
            }
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const meshes = Array.from(this.cardObjects.values()).map(card => card.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);
        
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            const card = this._findCardByMesh(mesh);
            if (card && !card.data.locked) {
                this._showCardDetail(card);
                this._notify('cardSelect', card.data);
            }
        }
    }

    _findCardByMesh(mesh) {
        for (const card of this.cardObjects.values()) {
            if (card.mesh === mesh || card.mesh.children.includes(mesh)) {
                return card;
            }
        }
        return null;
    }

    _updateHover() {
        if (this.isDetailMode) return;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const meshes = Array.from(this.cardObjects.values()).map(card => card.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);
        
        let newHovered = null;
        if (intersects.length > 0) {
            newHovered = this._findCardByMesh(intersects[0].object);
        }
        
        if (newHovered !== this.hoveredCard) {
            if (this.hoveredCard) {
                this.hoveredCard.setHover(false);
            }
            if (newHovered) {
                newHovered.setHover(true);
                this.renderer.domElement.style.cursor = 'pointer';
            } else {
                this.renderer.domElement.style.cursor = 'grab';
            }
            this.hoveredCard = newHovered;
        }
    }

    async loadCards() {
        this._clearCards();
        
        const allCards = TAROT_DB;
        const cardDataList = allCards.map(data => ({
            ...data,
            unlocked: collectionManager.isUnlocked(data.id)
        }));
        
        for (const data of cardDataList) {
            let card;
            if (data.unlocked) {
                card = await CardFactory.createCard(data, 0.8);
            } else {
                card = CardFactory.createLockedCard(data, 0.8);
            }
            this.cards.push(card);
            this.cardObjects.set(data.id, card);
            this.scene.add(card.mesh);
        }
        
        this.applyLayout(this.currentLayout);
    }

    _clearCards() {
        for (const card of this.cards) {
            this.scene.remove(card.mesh);
        }
        this.cards = [];
        this.cardObjects.clear();
    }

    applyLayout(layoutType) {
        this.currentLayout = layoutType;
        
        const positions = layoutManager.calculatePositions(this.cards, layoutType);
        const cameraSetup = layoutManager.getCameraForLayout(layoutType, this.cards.length);
        
        this.cards.forEach((card, index) => {
            if (positions[index]) {
                const posInfo = positions[index];
                card.setOriginalPosition(posInfo.position);
                card.setOriginalRotation(posInfo.rotation);
                card.mesh.scale.setScalar(posInfo.scale);
                card.originalScale.setScalar(posInfo.scale);
            }
        });
        
        if (!this.isDetailMode) {
            this.camera.position.lerp(cameraSetup.position, 0.01);
            this.controls.target.copy(cameraSetup.target);
        }
    }

    _showCardDetail(card) {
        if (card.data.locked) return;
        
        this.isDetailMode = true;
        this.detailCard = card;
        this.detailAutoRotate = true;
        
        card.saveOriginalState();
        
        this.savedCameraPosition.copy(this.camera.position);
        this.savedCameraTarget.copy(this.controls.target);
        
        const targetPos = new THREE.Vector3(0, 0, 0);
        const targetRot = new THREE.Euler(0, 0, 0);
        const targetScale = 1.5;
        
        this._animateToDetail(card, targetPos, targetRot, targetScale);
        
        this.controls.enablePan = false;
        this.controls.enabled = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        
        const cameraTargetPos = new THREE.Vector3(0, 0, 8);
        this._animateCameraTo(cameraTargetPos, targetPos, 500);
    }

    _animateCameraTo(targetPos, targetLookAt, duration) {
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isDetailMode) return;
            
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.controls.target.lerpVectors(startTarget, targetLookAt, ease);
            
            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    _animateToDetail(card, targetPos, targetRot, targetScale) {
        const startPos = card.mesh.position.clone();
        const startRot = card.mesh.rotation.clone();
        const startScale = card.mesh.scale.clone();
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isDetailMode || this.detailCard !== card) return;
            
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            card.mesh.position.lerpVectors(startPos, targetPos, ease);
            card.mesh.rotation.x = startRot.x + (targetRot.x - startRot.x) * ease;
            card.mesh.rotation.y = startRot.y + (targetRot.y - startRot.y) * ease;
            card.mesh.rotation.z = startRot.z + (targetRot.z - startRot.z) * ease;
            
            const scale = startScale.x + (targetScale - startScale.x) * ease;
            card.mesh.scale.setScalar(scale);
            
            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    closeDetail() {
        if (!this.isDetailMode || !this.detailCard) return;
        
        const card = this.detailCard;
        this.isDetailMode = false;
        this.detailCard = null;
        this.detailAutoRotate = false;
        this.isDragging = false;
        
        card.restoreOriginalState();
        
        this.controls.enablePan = true;
        this.controls.enabled = true;
        this.controls.autoRotate = false;
        
        this._animateCameraTo(this.savedCameraPosition, this.savedCameraTarget, 400);
    }

    nextLayout() {
        const next = layoutManager.nextLayout();
        this.applyLayout(next);
        return next;
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this._onResize();
        this.loadCards();
        this._startAnimation();
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this._stopAnimation();
    }

    _startAnimation() {
        if (this.animationId) return;
        
        let lastTime = Date.now() * 0.001;
        
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            const time = Date.now() * 0.001;
            const delta = time - lastTime;
            lastTime = time;
            
            if (this.isDetailMode && this.detailCard && this.detailAutoRotate) {
                this.detailCard.mesh.rotation.y += delta * this.detailRotateSpeed;
            }
            
            if (!this.isDetailMode) {
                for (const card of this.cards) {
                    card.updateFloat(time);
                }
            }
            
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    _stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].add(callback);
            return () => this.listeners[event].delete(callback);
        }
    }

    _notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    refresh() {
        this.loadCards();
    }

    dispose() {
        this._stopAnimation();
        this._clearCards();
        this.renderer.dispose();
        this.controls.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}
