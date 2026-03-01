/**
 * ComfyUI-Menu-Manager
 * 第三方插件菜单统一收纳管理器
 * 将各插件的悬浮图标/菜单栏图标收纳到统一容器中
 */

console.log('🚀 [MenuManager] 脚本开始加载...');

// 加载CSS样式
try {
    const cssPath = new URL('floating-manager.css', import.meta.url).href;
    console.log('[MenuManager] CSS路径:', cssPath);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
    console.log('✅ [MenuManager] CSS已加载');
} catch (e) {
    console.error('❌ [MenuManager] CSS加载失败:', e);
}

// 获取 app 对象的辅助函数
async function getApp() {
    // 如果全局已有 app，直接返回
    if (window.app) {
        return window.app;
    }
    
    // 尝试从标准路径导入（旧版 ComfyUI）
    try {
        const appModule = await import("../../scripts/app.js");
        return appModule.app || appModule.default;
    } catch (e) {
        console.log('[MenuManager] 标准路径导入失败，等待全局 app');
        // 等待全局 app 出现
        return new Promise((resolve) => {
            let attempts = 0;
            const checkApp = () => {
                attempts++;
                if (window.app) {
                    resolve(window.app);
                } else if (attempts < 50) {
                    setTimeout(checkApp, 100);
                } else {
                    console.warn('[MenuManager] 等待 app 超时，使用独立模式');
                    resolve(null);
                }
            };
            checkApp();
        });
    }
}

// 不需要收容的插件列表（节点内或侧边栏功能）
const EXCLUDED_PLUGINS = [
    'comfyui-prompt-assistant',  // 节点内提示词助手
    // 'comfyui-copilot',        // 左侧边栏AI助手 - 现在支持收纳
    'comfyui-mtb-input-output'   // MTB浏览输入输出目录功能
];

// 预设的第三方插件配置
const PRESET_PLUGINS = [
    {
        id: "comfyui-manager",
        name: "ComfyUI-Manager",
        icon: "puzzle",
        description: "插件管理器",
        findButton: () => {
            // 查找 Manager 按钮（可能有多个）
            return document.querySelectorAll('.comfyui-button[data-icon="puzzle"], #comfyui-manager-button');
        }
    },
    {
        id: "comfyui-share",
        name: "分享",
        icon: "share",
        description: "工作流分享",
        findButton: () => document.querySelectorAll('.comfyui-button[data-icon="share"]')
    },
    {
        id: "comfyui-favorite",
        name: "收藏",
        icon: "star",
        description: "收藏节点",
        findButton: () => document.querySelectorAll('.comfyui-button[data-icon="star"]')
    },
    {
        id: "comfyui-impact-pack",
        name: "Impact Pack",
        icon: "box",
        description: "Impact工具",
        findButton: () => document.querySelectorAll('.impact-toolbar, [class*="impact"]')
    },
    {
        id: "comfyui-easy-use",
        name: "Easy-Use",
        icon: "wand",
        description: "Easy-Use工具",
        findButton: () => document.querySelectorAll('.easyuse-toolbar')
    },
    {
        id: "comfyui-llm-party",
        name: "LLM Party",
        icon: "message-circle",
        description: "LLM工具",
        findButton: () => {
            // 通过特征查找 LLM Party 的工具栏
            const containers = document.querySelectorAll('div');
            for (const el of containers) {
                if (el.style.position === 'fixed') {
                    const buttons = el.querySelectorAll('button');
                    if (buttons.length >= 4) {
                        const titles = Array.from(buttons).map(b => b.title).join(',');
                        if (titles.includes('API-key') || titles.includes('FastAPI')) {
                            return [el];
                        }
                    }
                }
            }
            return [];
        }
    },
    {
        id: "comfyui-crystools",
        name: "Crystools",
        icon: "cpu",
        description: "监控工具",
        findButton: () => {
            // Crystools 可能有多个监控图标（CPU、内存、显存、温度等）
            const selectors = [
                '#crystools-monitor',
                '.crystools-monitor',
                '[class*="crystools"]',
                'button[title*="CPU"]',
                'button[title*="内存"]',
                'button[title*="显存"]',
                'button[title*="温度"]',
                'button[title*="使用率"]',
                'button[title*="GPU"]',
                'button[title*="RAM"]',
                'button[title*="VRAM"]',
                'button[title*="Temperature"]'
            ];
            return document.querySelectorAll(selectors.join(', '));
        }
    },
    {
        id: "comfyui-photoshop",
        name: "Photoshop",
        icon: "image",
        description: "PS连接",
        findButton: () => document.querySelectorAll('.photoshop-floating')
    },
    {
        id: "comfyui-modelscope-api",
        name: "ModelScope",
        icon: "database",
        description: "模型选择",
        findButton: () => document.querySelectorAll('.modelscope-floating-btn, [class*="modelscope"], button[title*="ModelScope"], button[aria-label*="ModelScope"]')
    },
    {
        id: "comfyui-lumi-batcher",
        name: "Lumi Batcher",
        icon: "layers",
        description: "批量处理工具",
        findButton: () => {
            const selectors = [
                '.batch-tools-trigger-container',
                '.lumi-batcher-toolbar',
                '[class*="lumi-batcher"]',
                '[class*="batch-tools"]',
                '.lumi-menu-btn',
                'button[data-lumi]',
                'button[title*="Lumi"]',
                'button[title*="Batcher"]',
                'button[title*="批量"]',
                '.comfyui-button[aria-label*="Lumi"]',
                '#lumi-batcher-button'
            ];
            return document.querySelectorAll(selectors.join(', '));
        }
    },
    {
        id: "comfyui-env-manager",
        name: "Environment Manager",
        icon: "package",
        description: "环境管理器",
        findButton: () => {
            const selectors = [
                '.env-manager-btn',
                '[class*="environment"]',
                '[class*="env-manager"]',
                '#env-manager-button',
                'button[title*="Environment"]',
                'button[title*="环境"]',
                'button[title*="Env"]',
                'button[aria-label*="Environment"]',
                '.comfyui-button[data-icon="package"]'
            ];
            return document.querySelectorAll(selectors.join(', '));
        }
    },
    {
        id: "comfyui-opencut",
        name: "OpenCut",
        icon: "video",
        description: "视频剪辑工具",
        findButton: () => {
            // 查找 OpenCut 的顶部菜单按钮
            return document.querySelectorAll('button[title*="opencut" i], button[data-icon="video"]');
        }
    },
    {
        id: "comfyui-lora-manager",
        name: "LoRA Manager",
        icon: "layers",
        description: "LoRA模型管理器",
        findButton: () => {
            // 查找 LoRA Manager 的顶部菜单按钮
            return document.querySelectorAll('button[aria-label*="LoRA Manager"], button[title*="LoRA Manager"]');
        }
    },
    {
        id: "comfyui-image-stream",
        name: "图像流显示",
        icon: "image",
        description: "图像流预览",
        findButton: () => document.querySelectorAll('.image-stream-btn, [class*="image-stream"], button[title*="图像流"], button[title*="stream"]')
    },
    {
        id: "rgthree-comfy",
        name: "rgthree",
        icon: "zap",
        description: "rgthree工具集",
        findButton: () => {
            // 查找 rgthree 的顶部菜单按钮组
            return document.querySelectorAll('.rgthree-comfybar-top-button-group, .rgthree-comfy-button');
        }
    },
    {
        id: "cg-use-everywhere",
        name: "Use Everywhere",
        icon: "link",
        description: "Use Everywhere工具",
        findButton: () => document.querySelectorAll('.use-everywhere-toolbar, [class*="use-everywhere"]')
    },
    {
        id: "comfyui-mixlab-nodes",
        name: "MixLab",
        icon: "layout",
        description: "MixLab工具集",
        findButton: () => {
            // 查找 MixLab 的悬浮工具栏
            const containers = document.querySelectorAll('div');
            const results = [];
            for (const el of containers) {
                if (el.style.position === 'fixed' || el.style.position === 'absolute') {
                    if ((el.className && el.className.includes('mixlab')) || (el.id && el.id.includes('mixlab'))) {
                        results.push(el);
                    }
                }
            }
            return results;
        }
    },
    {
        id: "comfyui-custom-scripts",
        name: "Custom Scripts",
        icon: "code",
        description: "自定义脚本",
        findButton: () => document.querySelectorAll('.custom-scripts-toolbar, [class*="custom-scripts"], button[title*="图像流"], button[title*="stream"], .custom-scripts-btn')
    },
    {
        id: "comfyui-gallery",
        name: "Gallery",
        icon: "image",
        description: "图库管理",
        findButton: () => document.querySelectorAll('.gallery-toolbar, .comfyui-gallery-button')
    },
    {
        id: "comfyui-prompt-assistant",
        name: "Prompt Assistant",
        icon: "edit",
        description: "提示词助手",
        findButton: () => document.querySelectorAll('.prompt-assistant-btn, [class*="prompt-assistant"]')
    },
    {
        id: "comfyui-sam3",
        name: "SAM3",
        icon: "target",
        description: "SAM3分割工具",
        findButton: () => document.querySelectorAll('.sam3-toolbar, [class*="sam3"]')
    },
    {
        id: "comfyui-reactor",
        name: "Reactor",
        icon: "refresh-cw",
        description: "Reactor换脸工具",
        findButton: () => document.querySelectorAll('.reactor-toolbar, [class*="reactor"]')
    },
    {
        id: "comfyui-kjnodes",
        name: "KJNodes",
        icon: "box",
        description: "KJNodes工具",
        findButton: () => document.querySelectorAll('.kjnodes-toolbar, [class*="kjnodes"]')
    },
    {
        id: "comfyui-videohelpersuite",
        name: "Video Helper",
        icon: "film",
        description: "视频处理工具",
        findButton: () => document.querySelectorAll('.video-helper-toolbar, [class*="video-helper"]')
    },
    {
        id: "comfyui-ultimatesdupscale",
        name: "Ultimate SD Upscale",
        icon: "maximize",
        description: "终极SD放大",
        findButton: () => document.querySelectorAll('.upscale-toolbar, [class*="upscale"]')
    },
    {
        id: "comfyui-controlnet-aux",
        name: "ControlNet Aux",
        icon: "git-branch",
        description: "ControlNet辅助",
        findButton: () => document.querySelectorAll('.controlnet-aux-toolbar, [class*="controlnet-aux"]')
    },
    {
        id: "comfyui-ic-light",
        name: "IC-Light",
        icon: "sun",
        description: "IC光照工具",
        findButton: () => document.querySelectorAll('.ic-light-toolbar, [class*="ic-light"]')
    },
    {
        id: "comfyui-instantid",
        name: "InstantID",
        icon: "user",
        description: "InstantID换脸",
        findButton: () => document.querySelectorAll('.instantid-toolbar, [class*="instantid"]')
    },
    {
        id: "comfyui-pulid",
        name: "PuLID",
        icon: "id-card",
        description: "PuLID身份保持",
        findButton: () => document.querySelectorAll('.pulid-toolbar, [class*="pulid"]')
    },
    {
        id: "comfyui-layerstyle",
        name: "Layer Style",
        icon: "layers",
        description: "图层样式工具",
        findButton: () => document.querySelectorAll('.layerstyle-toolbar, [class*="layerstyle"]')
    },
    {
        id: "comfyui-rmbg",
        name: "Remove BG",
        icon: "scissors",
        description: "背景移除工具",
        findButton: () => document.querySelectorAll('.rmbg-toolbar, [class*="rmbg"]')
    },
    {
        id: "comfyui-copilot",
        name: "Copilot",
        icon: "message-square",
        description: "AI助手",
        findButton: () => {
            // 查找 Copilot 的侧边栏标签页
            const selectors = [
                '#comfyui-copilot',
                '.cc-icon-logo',
                '[class*="copilot"]',
                'button[title*="Copilot" i]',
                'button[aria-label*="Copilot" i]',
                '.sidebar-tab[data-tab-id="comfyui-copilot"]',
                '.comfyui-copilot-tab'
            ];
            return document.querySelectorAll(selectors.join(', '));
        }
    },
    {
        id: "comfyui-nunchaku",
        name: "Nunchaku",
        icon: "cpu",
        description: "Nunchaku加速",
        findButton: () => document.querySelectorAll('.nunchaku-toolbar, [class*="nunchaku"]')
    },
    {
        id: "comfyui-wavespeed",
        name: "WaveSpeed",
        icon: "zap",
        description: "WaveSpeed加速",
        findButton: () => document.querySelectorAll('.wavespeed-toolbar, [class*="wavespeed"]')
    },
    {
        id: "comfyui-teacache",
        name: "TeaCache",
        icon: "coffee",
        description: "TeaCache加速",
        findButton: () => document.querySelectorAll('.teacache-toolbar, [class*="teacache"]')
    },
    {
        id: "comfyui-skbundle",
        name: "SKBundle",
        icon: "package",
        description: "SKBundle工具集",
        findButton: () => document.querySelectorAll('.skbundle-toolbar, [class*="skbundle"]')
    },
    {
        id: "comfyui-enricos-nodes",
        name: "Enrico's Nodes",
        icon: "image",
        description: "Enrico图像工具",
        findButton: () => document.querySelectorAll('.enrico-toolbar, [class*="enrico"]')
    },
    {
        id: "comfyui-comfyroll",
        name: "ComfyRoll",
        icon: "dice",
        description: "ComfyRoll节点",
        findButton: () => document.querySelectorAll('.comfyroll-toolbar, [class*="comfyroll"]')
    },
    {
        id: "comfyui-mtb",
        name: "MTB Nodes",
        icon: "terminal",
        description: "MTB节点集",
        findButton: () => document.querySelectorAll('.mtb-toolbar, [class*="mtb"]')
    },
    {
        id: "comfyui-faceanalysis",
        name: "Face Analysis",
        icon: "smile",
        description: "人脸分析工具",
        findButton: () => document.querySelectorAll('.faceanalysis-toolbar, [class*="faceanalysis"]')
    },
    {
        id: "comfyui-Logic",
        name: "Logic Nodes",
        icon: "git-merge",
        description: "逻辑节点",
        findButton: () => document.querySelectorAll('.logic-toolbar, [class*="logic"]')
    },
    {
        id: "comfyui-was-node-suite",
        name: "WAS Node Suite",
        icon: "tool",
        description: "WAS节点套件",
        findButton: () => document.querySelectorAll('.was-toolbar, [class*="was-ns"]')
    },
    {
        id: "comfyui-omnigen",
        name: "Omnigen",
        icon: "globe",
        description: "Omnigen工具",
        findButton: () => document.querySelectorAll('.omnigen-toolbar, [class*="omnigen"]')
    },
    {
        id: "comfyui-qwen",
        name: "Qwen",
        icon: "message-circle",
        description: "Qwen大模型",
        findButton: () => document.querySelectorAll('.qwen-toolbar, [class*="qwen"]')
    },
    {
        id: "comfyui-bizyair",
        name: "BizyAir",
        icon: "cloud",
        description: "BizyAir云节点",
        findButton: () => {
            // BizyAir 创建的是 div.bizyair-comfy-floating-button 浮动按钮
            const buttons = [];
            const bizyairBtn = document.querySelector('.bizyair-comfy-floating-button, #bizyair-menu-item');
            if (bizyairBtn) {
                buttons.push(bizyairBtn);
            }
            // 也尝试其他可能的选择器
            const selectors = [
                '.bizyair-toolbar',
                '[class*="bizyair"]:not([class*="bizyair-menu"]):not([class*="dialog"])',
                'button[title*="BizyAir" i]',
                'button[aria-label*="BizyAir" i]',
                'button[data-icon="cloud"]'
            ];
            const extraBtns = document.querySelectorAll(selectors.join(', '));
            extraBtns.forEach(btn => {
                if (!buttons.includes(btn)) {
                    buttons.push(btn);
                }
            });
            return buttons;
        }
    },
    {
        id: "comfyui-ollama",
        name: "Ollama",
        icon: "message-circle",
        description: "Ollama本地LLM",
        findButton: () => document.querySelectorAll('.ollama-toolbar, [class*="ollama"]')
    },
    {
        id: "comfyui-liveportrait",
        name: "LivePortrait",
        icon: "user",
        description: "LivePortrait动画",
        findButton: () => document.querySelectorAll('.liveportrait-toolbar, [class*="liveportrait"]')
    },
    {
        id: "comfyui-advanced-controlnet",
        name: "Advanced ControlNet",
        icon: "sliders",
        description: "高级ControlNet",
        findButton: () => document.querySelectorAll('.advanced-controlnet-toolbar, [class*="advanced-controlnet"]')
    },
    {
        id: "comfyui-ipadapter",
        name: "IPAdapter",
        icon: "image",
        description: "IPAdapter适配器",
        findButton: () => document.querySelectorAll('.ipadapter-toolbar, [class*="ipadapter"]')
    },
    {
        id: "comfyui-tile-processing",
        name: "Tile Processing",
        icon: "grid",
        description: "分块处理",
        findButton: () => document.querySelectorAll('.tile-toolbar, [class*="tile"]')
    },
    {
        id: "comfyui-frame-interpolation",
        name: "Frame Interpolation",
        icon: "film",
        description: "帧插值",
        findButton: () => document.querySelectorAll('.frame-interp-toolbar, [class*="frame-interpolation"]')
    },
    {
        id: "comfyui-detail-daemon",
        name: "Detail Daemon",
        icon: "eye",
        description: "细节增强",
        findButton: () => document.querySelectorAll('.detail-daemon-toolbar, [class*="detail-daemon"]')
    },
    {
        id: "comfyui-gendl",
        name: "GenDL",
        icon: "download",
        description: "模型下载工具",
        findButton: () => document.querySelectorAll('.gendl-toolbar, [class*="gendl"]')
    },
    {
        id: "comfyui-art-venture",
        name: "Art Venture",
        icon: "palette",
        description: "Art Venture工具",
        findButton: () => document.querySelectorAll('.artventure-toolbar, [class*="art-venture"]')
    },
    {
        id: "comfyui-photopea",
        name: "Photopea",
        icon: "image",
        description: "Photopea编辑器",
        findButton: () => document.querySelectorAll('.photopea-toolbar, [class*="photopea"]')
    },
    {
        id: "comfyui-res-master",
        name: "Resolution Master",
        icon: "monitor",
        description: "分辨率大师",
        findButton: () => document.querySelectorAll('.resmaster-toolbar, [class*="resolution-master"]')
    },
    {
        id: "comfyui-segment-anything",
        name: "Segment Anything",
        icon: "scissors",
        description: "SAM分割工具",
        findButton: () => document.querySelectorAll('.sam-toolbar, [class*="segment-anything"]')
    },
    {
        id: "comfyui-inpaint",
        name: "Inpaint Tools",
        icon: "edit-3",
        description: "修复工具集",
        findButton: () => document.querySelectorAll('.inpaint-toolbar, [class*="inpaint"]')
    },
    {
        id: "comfyui-layers-utility",
        name: "Layers Utility",
        icon: "copy",
        description: "图层工具",
        findButton: () => document.querySelectorAll('.layers-utility-toolbar, [class*="layers-utility"]')
    },
    {
        id: "comfyui-histogram",
        name: "Histogram",
        icon: "bar-chart-2",
        description: "直方图工具",
        findButton: () => document.querySelectorAll('.histogram-toolbar, [class*="histogram"]')
    },
    {
        id: "comfyui-align",
        name: "Align Nodes",
        icon: "align-center",
        description: "对齐节点",
        findButton: () => document.querySelectorAll('.align-toolbar, [class*="align"]')
    },
    {
        id: "comfyui-curve",
        name: "Curve Tool",
        icon: "activity",
        description: "曲线工具",
        findButton: () => document.querySelectorAll('.curve-toolbar, [class*="curve"]')
    },
    {
        id: "comfyui-pollinations",
        name: "Pollinations",
        icon: "flower",
        description: "Pollinations生成",
        findButton: () => document.querySelectorAll('.pollinations-toolbar, [class*="pollinations"]')
    },
    {
        id: "comfyui-openrouter",
        name: "OpenRouter",
        icon: "router",
        description: "OpenRouter API",
        findButton: () => document.querySelectorAll('.openrouter-toolbar, [class*="openrouter"]')
    },
    {
        id: "comfyui-translation",
        name: "Translation",
        icon: "languages",
        description: "翻译工具",
        findButton: () => document.querySelectorAll('.translation-toolbar, [class*="translation"]')
    },
    {
        id: "comfyui-flowbench",
        name: "FlowBench",
        icon: "gauge",
        description: "工作流基准",
        findButton: () => document.querySelectorAll('.flowbench-toolbar, [class*="flowbench"]')
    },
    {
        id: "comfyui-canvas",
        name: "Canvas",
        icon: "pen-tool",
        description: "画布工具",
        findButton: () => document.querySelectorAll('.canvas-toolbar, [class*="comfy-canvas"]')
    },
    {
        id: "comfyui-polotno-canvas",
        name: "Polotno Canvas",
        icon: "palette",
        description: "Polotno 画布编辑器",
        findButton: () => {
            // Polotno Canvas 使用 ComfyButton 创建，在 settingsGroup 中
            const buttons = [];
            // 查找所有 comfyui-button 并检查内容
            const allButtons = document.querySelectorAll('.comfyui-button, button, .p-button');
            let debugInfo = [];
            allButtons.forEach(btn => {
                const text = (btn.textContent || '').trim();
                const title = (btn.title || '').trim();
                const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                const tooltip = (btn.getAttribute('tooltip') || '').trim();
                const dataIcon = btn.getAttribute('data-icon') || '';
                const classes = btn.className || '';
                
                // 调试信息
                if (text.toLowerCase().includes('polotno') || 
                    title.toLowerCase().includes('polotno') ||
                    dataIcon === 'palette') {
                    debugInfo.push({text, title, dataIcon, classes: classes.substring(0, 50)});
                }
                
                if (text.includes('Polotno') || 
                    title.includes('Polotno') || 
                    ariaLabel.includes('Polotno') ||
                    tooltip.includes('Polotno') ||
                    dataIcon === 'palette') {
                    // 排除已经收纳的图标
                    if (!btn.closest('.floating-manager-container')) {
                        buttons.push(btn);
                    }
                }
            });
            if (debugInfo.length > 0) {
                console.log('[MenuManager] Polotno 调试信息:', debugInfo);
            }
            return buttons;
        }
    },
    {
        id: "comfyui-get-meta",
        name: "Get Metadata",
        icon: "file-text",
        description: "元数据工具",
        findButton: () => document.querySelectorAll('.getmeta-toolbar, [class*="get-meta"]')
    },
    {
        id: "comfyui-cache-dit",
        name: "CacheDiT",
        icon: "database",
        description: "DiT缓存",
        findButton: () => document.querySelectorAll('.cachedit-toolbar, [class*="cache-dit"]')
    },
    {
        id: "comfyui-gguf",
        name: "GGUF",
        icon: "package",
        description: "GGUF量化",
        findButton: () => document.querySelectorAll('.gguf-toolbar, [class*="gguf"]')
    },
    {
        id: "comfyui-flux",
        name: "Flux Tools",
        icon: "sparkles",
        description: "Flux工具集",
        findButton: () => document.querySelectorAll('.flux-toolbar, [class*="flux"]')
    },
    {
        id: "comfyui-wanvideo",
        name: "WanVideo",
        icon: "video",
        description: "Wan视频生成",
        findButton: () => document.querySelectorAll('.wanvideo-toolbar, [class*="wanvideo"]')
    },
    {
        id: "comfyui-seedvr",
        name: "SeedVR",
        icon: "scan",
        description: "SeedVR视频",
        findButton: () => document.querySelectorAll('.seedvr-toolbar, [class*="seedvr"]')
    },
    {
        id: "comfyui-layerforge",
        name: "LayerForge",
        icon: "layers",
        description: "LayerForge工具",
        findButton: () => document.querySelectorAll('.layerforge-toolbar, [class*="layerforge"]')
    },
    {
        id: "comfyui-handfixer",
        name: "Hand Fixer",
        icon: "hand",
        description: "手部修复",
        findButton: () => document.querySelectorAll('.handfixer-toolbar, [class*="handfixer"]')
    },
    {
        id: "comfyui-ic-edit",
        name: "IC Edit",
        icon: "edit",
        description: "IC编辑工具",
        findButton: () => document.querySelectorAll('.icedit-toolbar, [class*="ic-edit"]')
    },
    {
        id: "comfyui-images-grid",
        name: "Images Grid",
        icon: "grid",
        description: "图片网格",
        findButton: () => document.querySelectorAll('.imagesgrid-toolbar, [class*="images-grid"]')
    },
    {
        id: "comfyui-radiance",
        name: "Radiance",
        icon: "sun",
        description: "光照工具",
        findButton: () => document.querySelectorAll('.radiance-toolbar, [class*="radiance"]')
    },
    {
        id: "comfyui-turbodiffusion",
        name: "TurboDiffusion",
        icon: "fast-forward",
        description: "Turbo加速",
        findButton: () => document.querySelectorAll('.turbo-toolbar, [class*="turbodiffusion"]')
    },
    {
        id: "comfyui-utils-nodes",
        name: "Utils Nodes",
        icon: "tool",
        description: "工具节点集",
        findButton: () => document.querySelectorAll('.utils-toolbar, [class*="utils-nodes"]')
    },
    {
        id: "comfyui-supermerger",
        name: "Super Merger",
        icon: "git-merge",
        description: "模型合并",
        findButton: () => document.querySelectorAll('.supermerger-toolbar, [class*="supermerger"]')
    },
    {
        id: "comfyui-dynamic-prompts",
        name: "Dynamic Prompts",
        icon: "shuffle",
        description: "动态提示词",
        findButton: () => document.querySelectorAll('.dynamic-prompts-toolbar, [class*="dynamic-prompts"]')
    }
];

// 图标收纳管理器
class FloatingManager {
    constructor() {
        this.container = null;        // 主容器
        this.pluginIcons = new Map(); // 插件图标映射
        this.settings = this.loadSettings();
        this.observer = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.createContainer();
        await this.createManagerButton();
        this.startObserving();
        // 延迟扫描，等待其他插件加载
        // 多次扫描以确保加载较慢的插件（如 Polotno Canvas）能被检测到
        const scanDelays = [2000, 5000, 8000, 12000];
        scanDelays.forEach((delay, index) => {
            setTimeout(() => {
                this.scanPluginIcons();
                if (index === 0) {
                    console.log('[MenuManager] 菜单管理器已初始化');
                } else {
                    console.log(`[MenuManager] 第 ${index + 1} 次扫描完成，当前图标数: ${this.pluginIcons.size}`);
                }
            }, delay);
        });
    }

    // 创建图标收纳容器
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'floating-manager-container';
        this.container.className = 'floating-manager-container';
        
        // 根据设置决定是否默认显示
        if (this.settings.autoShow === false) {
            this.container.classList.add('hidden');
        }
        
        // 容器头部
        const header = document.createElement('div');
        header.className = 'fm-container-header';
        header.innerHTML = `
            <span class="fm-container-title">菜单管理器</span>
            <div class="fm-search-box">
                <svg class="fm-search-icon" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <input type="text" class="fm-search-input" placeholder="搜索插件...">
            </div>
            <div class="fm-header-actions">
                <button class="fm-container-view-toggle" title="切换图标/列表视图">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                    </svg>
                </button>
                <button class="fm-container-toggle" title="收起/展开">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                </button>
                <button class="fm-container-close" title="关闭">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
        
        // 内容区域
        const contentArea = document.createElement('div');
        contentArea.className = 'fm-content-area';

        // 图标网格视图
        const grid = document.createElement('div');
        grid.className = 'fm-icon-grid';

        // 插件列表管理视图
        const pluginListView = document.createElement('div');
        pluginListView.className = 'fm-plugin-list-view';
        pluginListView.style.display = 'none';

        contentArea.appendChild(grid);
        contentArea.appendChild(pluginListView);

        this.container.appendChild(header);
        this.container.appendChild(contentArea);
        document.body.appendChild(this.container);

        // 保存引用
        this.grid = grid;
        this.pluginListView = pluginListView;
        
        // 绑定收起/展开
        const toggleBtn = header.querySelector('.fm-container-toggle');
        let isCollapsed = this.settings.collapsed || false;
        if (isCollapsed) {
            this.container.classList.add('collapsed');
            toggleBtn.style.transform = 'rotate(180deg)';
        }
        
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            this.container.classList.toggle('collapsed');
            toggleBtn.style.transform = isCollapsed ? 'rotate(180deg)' : '';
            this.settings.collapsed = isCollapsed;
            this.saveSettings();
        });

        // 关闭按钮
        const closeBtn = header.querySelector('.fm-container-close');
        closeBtn.addEventListener('click', () => {
            this.container.classList.add('hidden');
        });

        // 视图切换按钮（图标/列表）
        const viewToggleBtn = header.querySelector('.fm-container-view-toggle');
        viewToggleBtn.addEventListener('click', () => this.toggleView());

        // 搜索功能
        const searchInput = header.querySelector('.fm-search-input');
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            this.filterIcons(keyword);
        });

        // 禁用拖拽（面板现在居中固定）
        // this.makeDraggable(this.container, header);
        
        // 禁用位置恢复（面板现在居中）
        // this.restoreContainerPosition();
    }
    
    // 显示设置面板
    showSettings() {
        // 创建设置弹窗
        const modal = document.createElement('div');
        modal.className = 'fm-settings-modal';

        // 生成插件列表HTML
        const pluginListHtml = this.generatePluginListHtml();

        modal.innerHTML = `
            <div class="fm-settings-content fm-settings-large">
                <div class="fm-settings-header">
                    <h3>菜单管理器设置</h3>
                    <button class="fm-settings-close">&times;</button>
                </div>
                <div class="fm-settings-body">
                    <div class="fm-settings-section">
                        <h4>全局设置</h4>
                        <label class="fm-setting-item">
                            <input type="checkbox" id="fm-auto-hide" ${this.settings.autoHideOriginal ? 'checked' : ''}>
                            <span>自动隐藏原插件图标</span>
                        </label>
                        <label class="fm-setting-item">
                            <input type="checkbox" id="fm-auto-show" ${this.settings.autoShow !== false ? 'checked' : ''}>
                            <span>启动时自动显示管理器</span>
                        </label>
                    </div>

                    <div class="fm-settings-section">
                        <h4>插件收纳管理 <span class="fm-plugin-count">(${this.pluginIcons.size} 个按钮)</span></h4>
                        <div class="fm-plugin-list">
                            ${pluginListHtml}
                        </div>
                    </div>

                    <div class="fm-setting-actions">
                        <button class="fm-btn fm-btn-primary" id="fm-save-settings">保存</button>
                        <button class="fm-btn" id="fm-cancel-settings">取消</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定插件收纳开关事件
        this.bindPluginToggleEvents(modal);

        // 关闭
        modal.querySelector('.fm-settings-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#fm-cancel-settings').addEventListener('click', () => modal.remove());

        // 保存
        modal.querySelector('#fm-save-settings').addEventListener('click', () => {
            this.settings.autoHideOriginal = modal.querySelector('#fm-auto-hide').checked;
            this.settings.autoShow = modal.querySelector('#fm-auto-show').checked;
            this.saveSettings();
            modal.remove();

            // 应用设置
            this.applyHideOriginalSetting();
        });

        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // 切换到插件列表视图
    showPluginListView() {
        if (!this.grid || !this.pluginListView) return;

        // 隐藏图标网格，显示插件列表
        this.grid.style.display = 'none';
        this.pluginListView.style.display = 'block';

        // 渲染插件列表内容
        this.renderPluginListView();
    }

    // 渲染插件列表视图
    renderPluginListView() {
        const pluginListHtml = this.generatePluginListHtml();
        
        // 计算插件数量（去重）
        const uniquePlugins = new Set();
        this.pluginIcons.forEach((value) => {
            uniquePlugins.add(value.plugin.id);
        });
        const pluginCount = uniquePlugins.size;
        const iconCount = this.pluginIcons.size;

        this.pluginListView.innerHTML = `
            <div class="fm-plugin-list-header">
                <h4>插件收纳管理 <span class="fm-plugin-count">(${pluginCount} 个插件, ${iconCount} 个按钮)</span></h4>
                <button class="fm-back-to-icons" title="返回图标视图">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    返回图标
                </button>
            </div>
            <div class="fm-plugin-list-content">
                ${pluginListHtml}
            </div>
            <div class="fm-plugin-list-footer">
                <label class="fm-setting-item">
                    <input type="checkbox" id="fm-auto-hide-inline" ${this.settings.autoHideOriginal ? 'checked' : ''}>
                    <span>自动隐藏原插件图标</span>
                </label>
            </div>
        `;

        // 绑定返回按钮
        this.pluginListView.querySelector('.fm-back-to-icons').addEventListener('click', () => {
            this.showIconView();
        });

        // 绑定插件收纳开关事件
        this.bindPluginToggleEvents(this.pluginListView);

        // 绑定自动隐藏开关
        const autoHideCheckbox = this.pluginListView.querySelector('#fm-auto-hide-inline');
        if (autoHideCheckbox) {
            autoHideCheckbox.addEventListener('change', (e) => {
                this.settings.autoHideOriginal = e.target.checked;
                this.saveSettings();
                this.applyHideOriginalSetting();
            });
        }
    }

    // 显示图标视图
    showIconView() {
        if (!this.grid || !this.pluginListView) return;

        this.grid.style.display = 'flex';
        this.pluginListView.style.display = 'none';
    }

    // 切换视图
    toggleView() {
        if (this.pluginListView.style.display === 'none') {
            this.showPluginListView();
        } else {
            this.showIconView();
        }
    }

    // 生成插件列表HTML
    generatePluginListHtml() {
        if (this.pluginIcons.size === 0) {
            return '<div class="fm-plugin-empty">暂无收纳的插件图标</div>';
        }

        // 按插件分组统计
        const pluginGroups = new Map();

        this.pluginIcons.forEach((value, key) => {
            const pluginId = value.plugin.id;
            const pluginName = value.plugin.name;

            if (!pluginGroups.has(pluginId)) {
                pluginGroups.set(pluginId, {
                    name: pluginName,
                    plugin: value.plugin,
                    icons: []
                });
            }
            const labelEl = value.element.querySelector('.fm-icon-label');
            pluginGroups.get(pluginId).icons.push({
                key: key,
                label: labelEl ? labelEl.textContent : ''
            });
        });

        // 生成HTML
        let html = '';
        pluginGroups.forEach((group, pluginId) => {
            const isCollected = this.isPluginCollected(pluginId);
            const iconCount = group.icons.length;
            const iconLabels = group.icons.map(i => i.label).join(', ');

            html += `
                <div class="fm-plugin-item" data-plugin-id="${pluginId}">
                    <div class="fm-plugin-info">
                        <span class="fm-plugin-name">${group.name}</span>
                        <span class="fm-plugin-detail">${iconCount} 个按钮 (${iconLabels})</span>
                    </div>
                    <label class="fm-plugin-toggle">
                        <input type="checkbox" ${isCollected ? 'checked' : ''} data-plugin-id="${pluginId}">
                        <span class="fm-toggle-slider"></span>
                    </label>
                </div>
            `;
        });

        return html;
    }

    // 检查插件是否处于收纳状态
    isPluginCollected(pluginId) {
        const pluginSetting = this.settings.plugins.find(p => p.id === pluginId);
        return pluginSetting ? pluginSetting.collected !== false : true; // 默认收纳
    }

    // 绑定插件收纳开关事件
    bindPluginToggleEvents(modal) {
        const toggles = modal.querySelectorAll('.fm-plugin-toggle input');

        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const pluginId = e.target.dataset.pluginId;
                const isCollected = e.target.checked;

                // 更新设置
                const pluginIndex = this.settings.plugins.findIndex(p => p.id === pluginId);
                if (pluginIndex >= 0) {
                    this.settings.plugins[pluginIndex].collected = isCollected;
                } else {
                    this.settings.plugins.push({ id: pluginId, collected: isCollected });
                }

                // 应用收纳/还原
                if (isCollected) {
                    this.collectPluginIcons(pluginId);
                } else {
                    this.restorePluginIcons(pluginId);
                }

                this.saveSettings();
            });
        });
    }

    // 收纳指定插件的图标
    collectPluginIcons(pluginId) {
        let hasIcons = false;
        this.pluginIcons.forEach((value, key) => {
            if (value.plugin.id === pluginId) {
                hasIcons = true;
                // 显示收纳的图标
                value.element.style.display = 'flex';
                // 隐藏原图标
                if (this.settings.autoHideOriginal) {
                    this.hideOriginalIcon(value.original);
                }
            }
        });
        
        // 如果没有找到图标，可能是扫描时被过滤了，重新扫描该插件
        if (!hasIcons) {
            this.rescanPlugin(pluginId);
        }
    }
    
    // 重新扫描指定插件
    rescanPlugin(pluginId) {
        const plugin = PRESET_PLUGINS.find(p => p.id === pluginId);
        if (!plugin || !plugin.findButton) return;
        
        console.log(`[MenuManager] 重新扫描插件: ${plugin.name}`);
        
        try {
            let buttons = plugin.findButton();
            if (!Array.isArray(buttons)) {
                buttons = Array.from(buttons);
            }
            
            const grid = this.container.querySelector('.fm-icon-grid');
            let btnIndex = 0;
            
            for (const originalBtn of buttons) {
                // 检查是否已被添加
                let alreadyAdded = false;
                this.pluginIcons.forEach((value) => {
                    if (value.original === originalBtn) {
                        alreadyAdded = true;
                    }
                });
                if (alreadyAdded) continue;
                
                // 创建收纳的图标（不过滤，因为用户明确想要收纳）
                const key = `${plugin.id}-${btnIndex}`;
                const iconItem = this.createIconItem(plugin, originalBtn, key, btnIndex);
                grid.appendChild(iconItem);
                
                // 保存映射
                this.pluginIcons.set(key, {
                    element: iconItem,
                    original: originalBtn,
                    plugin: plugin
                });
                
                // 标记按钮已被收纳
                originalBtn.dataset.fmCollected = 'true';
                
                // 隐藏原图标
                if (this.settings.autoHideOriginal) {
                    this.hideOriginalIcon(originalBtn);
                }
                
                btnIndex++;
            }
            
            // 刷新列表视图
            if (this.pluginListView && this.pluginListView.style.display !== 'none') {
                this.renderPluginListView();
            }
        } catch (e) {
            console.warn(`[MenuManager] 重新扫描 ${plugin.name} 失败:`, e);
        }
    }

    // 还原指定插件的图标
    restorePluginIcons(pluginId) {
        this.pluginIcons.forEach((value, key) => {
            if (value.plugin.id === pluginId) {
                // 隐藏收纳的图标
                value.element.style.display = 'none';
                // 显示原图标
                this.showOriginalIcon(value.original);
            }
        });
    }

    // 过滤图标
    filterIcons(keyword) {
        const grid = this.container.querySelector('.fm-icon-grid');
        const items = grid.querySelectorAll('.fm-icon-item');

        items.forEach(item => {
            const labelEl = item.querySelector('.fm-icon-label');
            const label = labelEl && labelEl.textContent ? labelEl.textContent.toLowerCase() : '';
            const title = item.title ? item.title.toLowerCase() : '';

            if (!keyword || label.includes(keyword) || title.includes(keyword)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // 显示/隐藏空提示
        const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
        let emptyTip = grid.querySelector('.fm-search-empty');

        if (visibleItems.length === 0 && keyword) {
            if (!emptyTip) {
                emptyTip = document.createElement('div');
                emptyTip.className = 'fm-search-empty';
                emptyTip.textContent = '未找到匹配的插件';
                grid.appendChild(emptyTip);
            }
            emptyTip.style.display = 'block';
        } else if (emptyTip) {
            emptyTip.style.display = 'none';
        }
    }

    // 创建管理器入口按钮
    async createManagerButton() {
        console.log('[MenuManager] 开始创建管理器按钮');
        
        // 方案1：尝试使用新版 ComfyUI 的 Vue 菜单（如果存在）
        if (typeof app !== 'undefined' && app.menu && app.menu.settingsGroup && app.menu.settingsGroup.element) {
            try {
                // 创建原生按钮元素
                const btn = document.createElement('button');
                btn.className = 'comfyui-button primary';
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:4px;vertical-align:middle;">
                        <path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                    </svg>
                    <span>菜单管理器</span>
                `;
                btn.title = '菜单管理器';
                btn.onclick = () => this.toggleContainer();
                
                app.menu.settingsGroup.element.before(btn);
                console.log('[MenuManager] 按钮已添加到菜单栏');
                return;
            } catch (e) {
                console.log('[MenuManager] 菜单栏添加失败，使用悬浮按钮:', e);
            }
        }
        
        // 方案2：创建悬浮触发按钮（通用方案，兼容所有版本）
        console.log('[MenuManager] 创建悬浮触发按钮');
        const btn = document.createElement('div');
        btn.id = 'fm-trigger-btn';
        btn.className = 'fm-trigger-btn';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
            </svg>
        `;
        btn.title = '菜单管理器';
        btn.onclick = () => this.toggleContainer();
        
        // 延迟添加到 body，确保 DOM 已准备好
        const addButton = () => {
            if (document.body) {
                document.body.appendChild(btn);
                console.log('[MenuManager] 悬浮按钮已添加到body');
            } else {
                console.error('[MenuManager] 无法添加按钮：document.body不存在');
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addButton);
        } else {
            addButton();
        }
    }

    // 切换容器显示/隐藏
    toggleContainer() {
        if (this.container) {
            this.container.classList.toggle('hidden');
        }
    }

    // 扫描并收纳插件图标
    scanPluginIcons() {
        const grid = this.container.querySelector('.fm-icon-grid');
        
        // 清空现有内容（避免重复）
        if (this.pluginIcons.size === 0) {
            grid.innerHTML = '';
        }
        
        let foundCount = 0;
        
        PRESET_PLUGINS.forEach(plugin => {
            // 检查是否在排除列表中
            if (EXCLUDED_PLUGINS.includes(plugin.id)) {
                return;
            }
            
            // 检查用户是否启用此插件
            const pluginSetting = this.settings.plugins.find(p => p.id === plugin.id);
            if (pluginSetting && pluginSetting.enabled === false) return;
            
            // 查找插件按钮
            let buttons = [];
            try {
                buttons = plugin.findButton ? plugin.findButton() : [];
            } catch (e) {
                console.warn(`[MenuManager] 查找 ${plugin.name} 按钮时出错:`, e);
            }
            
            // 确保 buttons 是数组
            if (!Array.isArray(buttons)) {
                buttons = Array.from(buttons);
            }
            
            if (buttons.length > 0) {
                console.log(`[MenuManager] ${plugin.name}: 找到 ${buttons.length} 个按钮`);
            }
            
            // 收纳所有有效的按钮（每个按钮只收纳一次）
            let btnIndex = 0;
            for (const originalBtn of buttons) {
                // 检查按钮是否已被其他插件收纳
                if (originalBtn.dataset && originalBtn.dataset.fmCollected === 'true') {
                    continue;
                }
                
                // 检查是否已存在相同的按钮引用
                let alreadyAdded = false;
                this.pluginIcons.forEach((value) => {
                    if (value.original === originalBtn) {
                        alreadyAdded = true;
                    }
                });
                if (alreadyAdded) continue;
                
                // 过滤掉弹窗/面板内的元素，只收纳主界面工具栏的按钮
                // 检查元素是否在弹窗/模态框/下拉菜单内
                const isInPopup = originalBtn.closest('.p-dialog, .modal, [role="dialog"], .dropdown-menu, .popup, [class*="popover"], [class*="tooltip"]');
                // 检查元素是否在固定定位的面板内（但不是工具栏）
                const isInFixedPanel = (() => {
                    const parent = originalBtn.parentElement;
                    if (!parent) return false;
                    const style = window.getComputedStyle(parent);
                    const isFixed = style.position === 'fixed' || style.position === 'absolute';
                    // 如果是工具栏则不算
                    const isToolbar = parent.classList && (
                        parent.classList.contains('comfyui-menu') ||
                        parent.classList.contains('comfy-menu') ||
                        parent.classList.contains('toolbar') ||
                        parent.classList.contains('tools') ||
                        parent.getAttribute('role') === 'toolbar'
                    );
                    return isFixed && !isToolbar;
                })();
                // 检查元素是否是表单控件本身
                const isFormElement = originalBtn.matches('input, textarea, select, label, form');
                
                if (isInPopup || isInFixedPanel || isFormElement) {
                    console.log(`[MenuManager] ${plugin.name}: 跳过弹窗/面板内元素`);
                    continue;
                }
                
                // 创建收纳的图标，使用按钮的真实名称
                const key = `${plugin.id}-${btnIndex}`;
                const iconItem = this.createIconItem(plugin, originalBtn, key, btnIndex);
                grid.appendChild(iconItem);
                foundCount++;
                btnIndex++;
                
                // 保存映射
                this.pluginIcons.set(key, {
                    element: iconItem,
                    original: originalBtn,
                    plugin: plugin
                });
                
                // 标记按钮已被收纳
                originalBtn.dataset.fmCollected = 'true';
                
                // 根据设置自动隐藏原图标
                if (this.settings.autoHideOriginal) {
                    this.hideOriginalIcon(originalBtn);
                }
            }
        });
        
        // 应用隐藏原图标设置
        this.applyHideOriginalSetting();
        
        // 更新空提示
        if (this.pluginIcons.size === 0) {
            grid.innerHTML = '<div class="fm-empty-tip">未检测到插件菜单<br>点击刷新按钮重试</div>';
        }
        
        console.log(`[MenuManager] 扫描完成，共收纳 ${this.pluginIcons.size} 个图标`);
    }

    // 隐藏原图标
    hideOriginalIcon(btn) {
        if (!btn) return;
        
        // 检查按钮是否还在DOM中
        if (!btn.parentElement) {
            console.warn('[MenuManager] 按钮已不在DOM中，无法隐藏');
            return;
        }
        
        // 保存原始样式
        if (!btn.dataset.fmOriginalDisplay) {
            btn.dataset.fmOriginalDisplay = btn.style.display || 'inline-flex';
        }
        
        // 隐藏按钮但保留在DOM中
        btn.style.display = 'none';
    }
    
    // 显示原图标
    showOriginalIcon(btn) {
        if (!btn) return;
        
        // 检查按钮是否还在DOM中
        if (!btn.parentElement) {
            console.warn('[MenuManager] 按钮已不在DOM中，无法显示');
            return;
        }
        
        // 恢复显示
        btn.style.display = btn.dataset.fmOriginalDisplay || 'inline-flex';
    }
    
    // 应用隐藏原图标设置
    applyHideOriginalSetting() {
        this.pluginIcons.forEach(({ original, plugin }) => {
            if (original && plugin) {
                // 检查该插件是否处于收纳状态
                const pluginSetting = this.settings.plugins.find(p => p.id === plugin.id);
                const isCollected = pluginSetting ? pluginSetting.collected !== false : true; // 默认收纳

                if (isCollected && this.settings.autoHideOriginal) {
                    // 只有在收纳状态且设置了自动隐藏时才隐藏
                    this.hideOriginalIcon(original);
                } else if (!isCollected) {
                    // 如果插件被还原，显示原图标
                    this.showOriginalIcon(original);
                }
            }
        });
    }

    // 创建图标项
    createIconItem(plugin, originalBtn, key, btnIndex = 0) {
        const item = document.createElement('div');
        item.className = 'fm-icon-item';

        let iconHtml = '';

        // 获取按钮的真实名称：优先使用 title，其次是 textContent，然后是 aria-label，最后是插件默认名
        let label = (originalBtn.title && originalBtn.title.trim()) ||
                    (originalBtn.getAttribute('aria-label') && originalBtn.getAttribute('aria-label').trim()) ||
                    (originalBtn.textContent && originalBtn.textContent.trim()) ||
                    `${plugin.name} ${btnIndex + 1}`;

        // 如果名称太长，尝试提取更简洁的版本
        if (label.length > 10) {
            // 尝试匹配常见的监控指标名称
            const commonNames = ['CPU', '内存', '显存', '温度', 'GPU', 'RAM', 'VRAM', 'Temp', '使用率', 'Usage'];
            for (const name of commonNames) {
                if (label.includes(name)) {
                    // 如果包含这些关键词，尝试提取关键词及其后面的内容
                    const idx = label.indexOf(name);
                    label = label.substring(idx, idx + 10);
                    break;
                }
            }
        }

        // 尝试获取原按钮的图标
        const svg = originalBtn.querySelector('svg');
        if (svg) {
            iconHtml = svg.outerHTML;
        } else {
            // 使用预设图标
            iconHtml = this.getPresetIcon(plugin.icon);
        }

        item.innerHTML = `
            <div class="fm-icon-wrapper">
                ${iconHtml}
            </div>
            <span class="fm-icon-label">${label}</span>
        `;
        
        // 点击时触发原按钮
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (originalBtn) {
                // 显示原按钮
                this.showOriginalIcon(originalBtn);
                
                // 确保原按钮可见并可交互
                originalBtn.style.display = 'inline-flex';
                originalBtn.style.visibility = 'visible';
                originalBtn.style.opacity = '1';
                originalBtn.style.pointerEvents = 'auto';
                
                // 立即触发点击
                try {
                    originalBtn.click();
                } catch (err) {
                    console.warn(`[MenuManager] 点击 ${plugin.name} 失败:`, err);
                }
                
                // 尝试触发 mousedown 和 mouseup（某些插件需要）
                originalBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                originalBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                
                // 如果设置了自动隐藏且插件处于收纳状态，3秒后再次隐藏原图标
                if (this.settings.autoHideOriginal) {
                    setTimeout(() => {
                        const pluginSetting = this.settings.plugins.find(p => p.id === plugin.id);
                        const isCollected = pluginSetting ? pluginSetting.collected !== false : true;
                        if (isCollected) {
                            this.hideOriginalIcon(originalBtn);
                        }
                    }, 3000);
                }
            } else {
                console.warn(`[MenuManager] ${plugin.name} 的原按钮不存在`);
            }
            
            // 视觉反馈
            item.classList.add('clicked');
            setTimeout(() => item.classList.remove('clicked'), 200);
        });
        
        // 悬停提示
        item.title = plugin.description || plugin.name;
        
        return item;
    }

    // 获取预设图标
    getPresetIcon(iconName) {
        const icons = {
            'puzzle': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>',
            'star': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
            'share': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
            'apps': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>'
        };
        return icons[iconName] || icons['apps'];
    }

    // 使容器可拖拽
    makeDraggable(container, handle) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = container.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            container.style.transition = 'none';
            handle.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            
            // 边界限制
            const maxLeft = window.innerWidth - container.offsetWidth;
            const maxTop = window.innerHeight - container.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.transition = '';
                handle.style.cursor = 'grab';
                this.saveContainerPosition();
            }
        });
    }

    // 保存容器位置
    saveContainerPosition() {
        const rect = this.container.getBoundingClientRect();
        const position = {
            left: rect.left,
            top: rect.top
        };
        localStorage.setItem('floating-manager-position', JSON.stringify(position));
    }

    // 恢复容器位置
    restoreContainerPosition() {
        try {
            const saved = localStorage.getItem('floating-manager-position');
            if (saved) {
                const pos = JSON.parse(saved);
                this.container.style.left = pos.left + 'px';
                this.container.style.top = pos.top + 'px';
                this.container.style.right = 'auto';
            }
        } catch (e) {
            // 使用默认位置
            this.container.style.right = '20px';
            this.container.style.top = '60px';
        }
    }

    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('floating-manager-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 确保默认设置存在
                return {
                    plugins: parsed.plugins || [],
                    autoHideOriginal: parsed.autoHideOriginal !== undefined ? parsed.autoHideOriginal : true,
                    autoShow: parsed.autoShow !== undefined ? parsed.autoShow : true,
                    collapsed: parsed.collapsed || false,
                    ...parsed
                };
            }
        } catch (e) {
            console.warn('[MenuManager] 加载设置失败:', e);
        }
        // 默认设置
        return {
            plugins: [],
            autoHideOriginal: true,
            autoShow: true,
            collapsed: false
        };
    }

    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem('floating-manager-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('[MenuManager] 保存设置失败:', e);
        }
    }

    // 开始监听DOM变化（检测新添加的插件按钮）
    startObserving() {
        this.observer = new MutationObserver((mutations) => {
            let shouldRescan = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查是否是按钮或包含按钮
                        if ((node.matches && node.matches('.comfyui-button, button')) ||
                            (node.querySelector && node.querySelector('.comfyui-button, button'))) {
                            shouldRescan = true;
                        }
                        // 检查是否是悬浮元素
                        if ((node.style && node.style.position === 'fixed') ||
                            (node.querySelector && node.querySelector('[style*="position: fixed"]'))) {
                            shouldRescan = true;
                        }
                        // 检查可能包含插件按钮的容器
                        if (node.classList && (
                            node.classList.contains('toolbar') ||
                            node.classList.contains('menu') ||
                            node.classList.contains('panel')
                        )) {
                            shouldRescan = true;
                        }
                    }
                }
            }

            if (shouldRescan) {
                // 延迟扫描，等待元素完全渲染
                setTimeout(() => this.scanPluginIcons(), 1000);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 添加手动刷新按钮
        this.addRefreshButton();
    }
    
    // 添加刷新按钮
    addRefreshButton() {
        const header = this.container.querySelector('.fm-container-header');
        if (!header) return;
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'fm-refresh-btn';
        refreshBtn.title = '清空并刷新图标';
        refreshBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
        `;
        refreshBtn.onclick = () => {
            console.log('[MenuManager] 清空并重新扫描...');
            // 清空网格和映射
            const grid = this.container.querySelector('.fm-icon-grid');
            grid.innerHTML = '';
            
            // 恢复所有原图标
            this.pluginIcons.forEach(({ original }) => {
                if (original) {
                    original.dataset.fmCollected = 'false';
                    this.showOriginalIcon(original);
                }
            });
            
            // 清空映射
            this.pluginIcons.clear();
            
            // 重新扫描
            this.scanPluginIcons();
        };
        
        const actionsDiv = header.querySelector('.fm-header-actions');
        if (actionsDiv) {
            actionsDiv.insertBefore(refreshBtn, actionsDiv.firstChild);
        }
    }

    // 销毁
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.container) {
            this.container.remove();
        }
        // 恢复所有原图标
        this.pluginIcons.forEach(({ original }) => {
            if (original) {
                this.showOriginalIcon(original);
            }
        });
    }
}

// 全局实例
let menuManager;

// 初始化函数
function initMenuManager() {
    menuManager = new FloatingManager();
    window.menuManager = menuManager;
}

// 主初始化逻辑
(async function main() {
    const app = await getApp();
    
    // 注册ComfyUI扩展（如果 app 存在）
    if (app && typeof app.registerExtension === 'function') {
        app.registerExtension({
            name: "Comfy.MenuManager",
            async setup() {
                initMenuManager();
            }
        });
        console.log('[MenuManager] 已注册为 ComfyUI 扩展');
    } else {
        console.log('[MenuManager] 使用独立初始化模式');
        // 直接初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMenuManager);
        } else {
            initMenuManager();
        }
    }
})();

export { FloatingManager, menuManager };
