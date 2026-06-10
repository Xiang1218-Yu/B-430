# MysticTarot - 灵动交互 3D 塔罗占卜系统

**MysticTarot** 是一款融合了 **Three.js 3D 渲染** 与 **MediaPipe 手势识别** 技术的沉浸式数字占卜应用。它通过 AI 视觉追踪捕捉用户的生理意图，实现了“灵能感知”、“隔空取牌”与“意志确认”的深度交互体验。

---

## 🔮 核心特性

- **AI 手势识别系统**：集成 MediaPipe 全球领先的手部追踪技术，支持多种核心生理手势实时操控 3D 实体。
- **经典塔罗图源**：接入高清 **Rider-Waite-Smith (RWS)** 经典塔罗牌图源作为卡牌正面，提供更具神秘学的视觉质感。
- **双模加载机制**：支持 **本地 (Local)** 与 **在线 (URL)** 两种资源加载方式，通过 `ASSETS_CONFIG` 轻松切换。
- **手动交互切换**：除了自动降级外，新增手动模式切换按钮，用户可在“灵动触控（手势）”与“沉浸观赏（鼠标）”模式间随意自由切换。
- **粒子焚烧特效**：确认抽牌后，卡牌实时转化为 6000+ 金色粒子消散（Ashing Effect），象征旧念消失与宿命降临。
- **完整大阿卡纳堆**：内置完整的 **22张大阿卡纳牌** 数据库，涵盖从“愚者”到“世界”的所有相位。
- **沉浸式 3D 祭坛**：基于 Three.js 构建，包含 Torus 发光底座、Grid 纵深网格及 Fog 动态雾效。
- **程序化纹理兜底**：若网络图片加载失败，系统会自动降级回 Canvas 动态生成的纹理，确保 100% 可用。

---

## 🖐️ 操作指南 (Interaction Strategy)

### 模式切换
点击页面左下角的 **“切换交互模式”** 按钮即可在以下两种模式间切换：

### 1. 手势交互模式 (推荐)
| 手势 | 功能描述 | 交互反馈 |
| :--- | :--- | :--- |
| **✋ 张开手掌** | **召唤圣契** | 卡牌从祭坛下方平滑升起进入视野中央 |
| **🤌 捏合指尖** | **抓取观察** | 卡牌响应指尖位置，随手移动，开启贴近观察模式 |
| **👆 食指指向** | **专注细节** | 触发局部放大，卡牌向镜头前探近 |
| **✊ 紧握拳头** | **确认契约** | 焚毁卡牌，触发金粉粒子特效，记录至历史记录 |

### 2. 鼠标/触控模式
- **点击场景中心**：触发抽牌。
- **卡牌显示时点击**：触发焚毁确认。
- **鼠标右键拖拽**：旋转祭坛视角。
- **鼠标滚轮**：缩放观察距离。
- **Space 键**：快捷执行当前操作。

---

## 🛠️ 技术实现 (Tech Stack)

- **核心架构**: Vanilla JavaScript (ES6+)
- **3D 引擎**: [Three.js r160](https://threejs.org/)
- **AI 算法**: [Google MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands)
- **图像处理**: TextureLoader + Canvas fallback
- **交互逻辑**: 状态机驱动 (IDLE -> DRAWING -> HOVERING -> ASHING)

---

## 🃏 塔罗图源引入说明 (Tarot Assets Integration)

本项目引入了神秘学领域最具代表性的 **Rider-Waite-Smith (RWS)** 经典塔罗牌图源。以下是具体的引入与实现方案：

### 1. 图源选择与映射
- **经典重现**：选用了 1910 年出版的高清重绘版 RWS 牌面，确保占卜过程中的视觉符号精确且富有艺术感。
- **智能映射**：系统建立了 `TAROT_DB` 与 资源文件的 1:1 映射机制。例如：
  - 大阿卡纳：`m00` (愚者) → `00.jpg`
  - 小阿卡纳：`w01` (权杖一) → `w01.jpg`

### 2. 异步加载逻辑
应用使用 **Three.js `TextureLoader`** 进行异步加载，流程如下：
1. **策略检测**：根据 `ASSETS_CONFIG.mode` 判断首选加载路径。
2. **异步获取**：尝试从 GitHub CDN（URL 模式）或本地磁盘（Local 模式）获取静态图片资源。
3. **纹理优化**：对加载后的纹理应用 `Anisotropy (16x)` 各向异性过滤及 `sRGB` 色彩空间，确保在 3D 旋转视角下，牌面图案依然清晰锐利且色彩还原准确。

### 3. 高度可靠的兜底方案
为了应对极端弱网环境，系统内置了**Canvas 动态生成引擎**：
- 如果 RWS 图片加载失败（如网络超时或资源丢失），`loadCardTexture` 会静默触发 `generateProceduralTexture`。
- 兜底纹理会动态绘制：**特定牌组主色调背景 + 金色边框 + 神秘学符号 + 卡牌中文名称**，确保占卜流程的连续性和可用性。

---

## 🚀 资源配置 (Assets Configuration)

在 `index.html` 的脚本部分，你可以通过修改 `ASSETS_CONFIG` 来更改图片来源：

```javascript
const ASSETS_CONFIG = {
    mode: 'URL', // 'URL' 从网络加载，'LOCAL' 从本地加载
    baseUrl: 'https://raw.githubusercontent.com/ekelen/tarot/master/images/cards/',
    localPath: './assets/cards/'
};
```

---

## 📂 目录结构
- `index.html`: 核心应用文件。
- `README.md`: 项目手册。
- `assets/cards/`: (可选) 本地存放塔罗牌图片的目录。

---
© 2026 MysticTarot Team. Designed for Excellence in Mysticism.
