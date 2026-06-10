import * as THREE from 'three';

const ASSETS_CONFIG = {
    mode: 'URL',
    baseUrl: 'https://raw.githubusercontent.com/ekelen/tarot/master/images/cards/',
    localPath: './assets/cards/'
};

const CARD_WIDTH = 2.4;
const CARD_HEIGHT = 4.2;
const CARD_DEPTH = 0.12;

function getCardImageUrl(id) {
    const root = ASSETS_CONFIG.mode === 'URL' ? ASSETS_CONFIG.baseUrl : ASSETS_CONFIG.localPath;
    let fileName = id;
    if (id.startsWith('m')) {
        fileName = id.substring(1);
    }
    return `${root}${fileName}.jpg`;
}

function generateProceduralTexture(data) {
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
    }[data.id[0]] || '#050507';

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
    ctx.fillText(data.name, canvas.width / 2, canvas.height * 0.85);

    ctx.font = '120px "Outfit"';
    const symbols = { 'm': '✨', 'w': '🔥', 'c': '🌊', 's': '⚔️', 'p': '🪙' };
    ctx.fillText(symbols[data.id[0]] || '🔮', canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '24px "Outfit"';
    ctx.fillText(data.id.toUpperCase(), canvas.width / 2, 70);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
}

function generateBackTexture() {
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function loadCardTexture(data) {
    if (textureCache.has(data.id)) {
        return Promise.resolve(textureCache.get(data.id));
    }

    const url = getCardImageUrl(data.id);
    return new Promise((resolve) => {
        textureLoader.load(url,
            (tex) => {
                tex.anisotropy = 16;
                tex.colorSpace = THREE.SRGBColorSpace;
                textureCache.set(data.id, tex);
                resolve(tex);
            },
            undefined,
            () => {
                console.warn(`Failed to load texture for ${data.id}, falling back to procedural.`);
                const tex = generateProceduralTexture(data);
                textureCache.set(data.id, tex);
                resolve(tex);
            }
        );
    });
}

let backTexture = null;
function getBackTexture() {
    if (!backTexture) {
        backTexture = generateBackTexture();
    }
    return backTexture;
}

export class TarotCard {
    constructor(mesh, data) {
        this.mesh = mesh;
        this.data = data;
        this.isReversed = false;
        this.originalPosition = new THREE.Vector3();
        this.originalRotation = new THREE.Euler();
        this.originalScale = new THREE.Vector3(1, 1, 1);
        this.isDetailMode = false;
        this.floatOffset = Math.random() * 100;
        this.isHovered = false;
    }

    setOriginalPosition(pos) {
        this.originalPosition.copy(pos);
        this.mesh.position.copy(pos);
    }

    setOriginalRotation(rot) {
        this.originalRotation.copy(rot);
        this.mesh.rotation.copy(rot);
    }

    saveOriginalState() {
        this.originalPosition.copy(this.mesh.position);
        this.originalRotation.copy(this.mesh.rotation);
        this.originalScale.copy(this.mesh.scale);
    }

    restoreOriginalState() {
        this.mesh.position.copy(this.originalPosition);
        this.mesh.rotation.copy(this.originalRotation);
        this.mesh.scale.copy(this.originalScale);
        this.isDetailMode = false;
    }

    updateFloat(time) {
        if (!this.isDetailMode) {
            const floatY = Math.sin(time + this.floatOffset) * 0.08;
            this.mesh.position.y = this.originalPosition.y + floatY;
        }
    }

    setHover(hovered) {
        this.isHovered = hovered;
        const targetScale = hovered ? 1.1 : 1;
        this.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
}

export class CardFactory {
    static async createCard(data, scale = 1) {
        const geom = new THREE.BoxGeometry(
            CARD_WIDTH * scale,
            CARD_HEIGHT * scale,
            CARD_DEPTH * scale
        );

        const frontTex = await loadCardTexture(data);
        const backTex = getBackTexture();

        const sideMat = new THREE.MeshStandardMaterial({ 
            color: 0x221a0a, 
            metalness: 0.8, 
            roughness: 0.2 
        });
        const frontMat = new THREE.MeshStandardMaterial({ 
            map: frontTex, 
            roughness: 0.1, 
            metalness: 0.2 
        });
        const backMat = new THREE.MeshStandardMaterial({ 
            map: backTex, 
            roughness: 0.3 
        });

        const mats = [
            sideMat, sideMat, sideMat, sideMat,
            frontMat, backMat
        ];

        const mesh = new THREE.Mesh(geom, mats);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const card = new TarotCard(mesh, data);
        return card;
    }

    static createLockedCard(data, scale = 1) {
        const geom = new THREE.BoxGeometry(
            CARD_WIDTH * scale,
            CARD_HEIGHT * scale,
            CARD_DEPTH * scale
        );

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 896;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, 512, 896);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, 472, 856);

        ctx.fillStyle = '#444';
        ctx.textAlign = 'center';
        ctx.font = 'bold 60px "Outfit"';
        ctx.fillText('?', 256, 480);

        ctx.font = '24px "Outfit"';
        ctx.fillText('未解锁', 256, 560);

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 16;

        const sideMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.5, 
            roughness: 0.5 
        });
        const faceMat = new THREE.MeshStandardMaterial({ 
            map: tex, 
            roughness: 0.5, 
            metalness: 0.1 
        });

        const mats = [
            sideMat, sideMat, sideMat, sideMat,
            faceMat, faceMat
        ];

        const mesh = new THREE.Mesh(geom, mats);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const card = new TarotCard(mesh, { ...data, locked: true });
        return card;
    }
}

export { CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH };
