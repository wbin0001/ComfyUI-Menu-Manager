# ComfyUI-Menu-Manager

<p align="center">
  <b>ComfyUI 菜单管理器</b> - 统一收纳和管理第三方插件图标
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-1.1.0-blue" alt="版本">
  <img src="https://img.shields.io/badge/ComfyUI-兼容-green" alt="ComfyUI">
  <img src="https://img.shields.io/badge/支持插件-90+-orange" alt="支持插件">
</p>

---

## ✨ 功能介绍

将分散在 ComfyUI 界面各处的插件图标统一收纳到一个面板中，让工作区更加整洁有序。

### 核心特性

| 特性 | 说明 |
|------|------|
| 📦 **统一管理** | 收纳 90+ 个插件的图标和菜单按钮 |
| 🔍 **快速搜索** | 顶部搜索框，即时过滤插件图标 |
| 🎛️ **双视图切换** | 图标视图 ↔ 列表视图，一键切换 |
| 👁️ **自动隐藏** | 智能隐藏原插件图标，保持界面整洁 |
| 🎯 **功能完整** | 点击收纳图标 = 点击原图标，功能无损 |
| 💾 **状态记忆** | 自动保存设置，下次启动恢复 |

---

## 📹 演示视频

在这里你可以看到 ComfyUI-Menu-Manager 的实际使用效果：

<video src="./demo/demo-video.mp4" width="800" height="500" controls>
  您的浏览器不支持视频标签。
</video>

---

## 📥 安装方法

### 方式一：直接下载（推荐）

1. 下载本仓库代码
2. 将文件夹复制到 `ComfyUI/custom_nodes/` 目录
3. 重启 ComfyUI

### 方式二：Git 克隆

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/your-username/ComfyUI-Menu-Manager.git
```

### 目录结构

```
ComfyUI/custom_nodes/ComfyUI-Menu-Manager/
├── __init__.py
├── web/
│   ├── floating-manager.js    # 核心逻辑
│   └── floating-manager.css   # 样式文件
└── README.md
```

---

## 🚀 使用指南

### 快速开始

1. **打开面板** - 点击顶部菜单栏的「菜单管理器」按钮
2. **使用图标** - 点击面板中的图标即可触发原插件功能
3. **切换视图** - 点击 ⊞ 按钮在图标/列表视图间切换
4. **搜索插件** - 在顶部搜索框输入关键词快速定位

### 界面操作

| 按钮 | 功能 |
|------|------|
| ⊞ | 切换图标视图 / 列表视图 |
| ▼ | 折叠/展开面板 |
| ✕ | 关闭面板 |
| 🔄 | 刷新图标，重新扫描所有插件 |

### 列表视图功能

- **插件收纳开关** - 控制单个插件是否被收纳
- **自动隐藏设置** - 开启后自动隐藏原插件图标

---

## 🎯 支持的插件

<details>
<summary><b>📌 点击展开完整插件列表 (90+)</b></summary>

### 顶部菜单
- ComfyUI-Manager、ComfyUI-Share、rgthree-comfy、LoRA Manager、OpenCut

### 图像处理
- ComfyUI-Impact-Pack、ComfyUI-Easy-Use、SAM3、Reactor、IC-Light、PuLID、Remove BG、Layer Style

### ControlNet
- ControlNet Aux、Advanced ControlNet、IPAdapter

### AI/LLM
- LLM Party、ComfyUI-Copilot、Ollama、Qwen、**BizyAir**、OmniGen

### 视频处理
- Video Helper Suite、Frame Interpolation、Ultimate SD Upscale、WanVideoWrapper、SeedVR

### 工具类
- Use Everywhere、MixLab Nodes、Custom Scripts、Gallery、Prompt Assistant、KJNodes、MTB Nodes、Polotno Canvas

### 加速优化
- Nunchaku、WaveSpeed、TeaCache、TurboDiffusion、CacheDiT

### 其他
- Crystools（监控工具）、Photoshop 连接、Photopea、Face Analysis、LivePortrait、WAS Node Suite 等

</details>

---

## ⚙️ 高级配置

### 添加新插件支持

如果某个插件未被收纳，可在 `web/floating-manager.js` 中添加配置：

```javascript
{
    id: "your-plugin-id",
    name: "插件名称",
    icon: "icon-name",
    description: "插件描述",
    findButton: () => document.querySelectorAll('.your-plugin-button')
}
```

**如何确定选择器：**
1. 按 F12 打开开发者工具
2. 检查插件按钮的 `class`、`id` 或 `title`
3. 使用合适的选择器，如 `button[title*="插件名"]`

---

## 🔧 常见问题

<details>
<summary><b>插件未显示在管理器中？</b></summary>

1. 确认插件已正确安装并启用
2. 等待 5-10 秒，部分插件加载较慢（如 Polotno Canvas）
3. 点击面板右上角 🔄 刷新按钮重新扫描
4. 检查浏览器控制台是否有错误信息

</details>

<details>
<summary><b>图标点击无反应？</b></summary>

1. 确认原插件功能正常
2. 尝试关闭「自动隐藏原插件图标」选项
3. 刷新页面重新加载

</details>

<details>
<summary><b>图标显示重复？</b></summary>

1. 点击 🔄 刷新按钮重新扫描
2. 检查是否有多个插件使用相同的 CSS 类名

</details>

---

## 📝 更新日志

### v1.1.0 (2026-02)
- ✨ 新增列表视图，支持插件级管理
- ✨ 新增搜索功能
- ✨ 新增关闭按钮和折叠功能
- ✨ 支持多按钮收纳（如 Crystools）
- ✨ 显示原按钮真实名称
- 🐛 修复 ModelScope 误匹配问题
- 🐛 修复还原后被自动隐藏的问题
- 💄 面板改为居中弹窗 (80vw × 75vh)

### v1.0.0
- ✨ 初始版本发布
- ✨ 支持 90+ 插件收纳
- ✨ 设置记忆功能

---

## 📄 许可证

MIT License

---

<p align="center">
  <sub>使用本插件不会影响原插件功能，仅将图标收纳到统一容器便于管理</sub>
</p>
