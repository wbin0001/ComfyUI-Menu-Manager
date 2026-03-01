"""
ComfyUI-Floating-Manager
统一管理ComfyUI中各插件的悬浮图标/窗口位置、显示或隐藏
"""

import os
import folder_paths

# ComfyUI 会自动加载 web 目录下的 .js 文件
WEB_DIRECTORY = os.path.join(os.path.dirname(__file__), "web")
NODE_CLASS_MAPPINGS = {}
__all__ = ["NODE_CLASS_MAPPINGS"]

print("="*60)
print("[ComfyUI-Menu-Manager] 插件已加载")
print(f"[ComfyUI-Menu-Manager] Web目录: {WEB_DIRECTORY}")
print("="*60)
