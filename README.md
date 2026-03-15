# Pinpoint - 图像地理位置分析工具

Pinpoint 是一个基于 AI 的图像地理位置分析工具，能够通过分析图像内容和 EXIF 数据来推断图像的拍摄位置。

## 功能特性

- 📷 **图像上传与分析**：支持上传图像并自动提取 EXIF 数据
- 🤖 **AI 地理位置推断**：使用先进的 AI 模型分析图像内容，推断拍摄位置
- 🗺️ **地图可视化**：在地图上显示推断的地理位置
- 📊 **EXIF 数据查看**：详细展示图像的 EXIF 元数据
- 📋 **分析历史记录**：保存和管理分析历史
- 📝 **报告生成**：生成详细的分析报告

## 技术栈

- **前端**：React 19, TypeScript, Tailwind CSS, Leaflet, Lucide React, Motion
- **后端**：Express (本地服务器)
- **AI 服务**：支持 SiliconFlow 和 Ollama 本地模型
- **构建工具**：Vite

## 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装

1. 克隆仓库

```bash
git clone <仓库地址>
cd pinpoint
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 文件为 `.env.local` 并填写必要的配置：

```bash
cp .env.example .env.local
```

在 `.env.local` 文件中配置以下内容：

```
# SiliconFlow API 密钥（可选，如使用 SiliconFlow 服务）
VITE_SILICONFLOW_API_KEY=your_api_key_here

# 默认 AI 模型配置
VITE_DEFAULT_PROVIDER=siliconflow # 或 ollama
VITE_DEFAULT_MODEL=deepseek-ai/deepseek-vl2
```

### 运行

启动开发服务器：

```bash
npm run dev
```

或者使用提供的启动脚本：

```bash
# Windows
./start.bat

# PowerShell
./start.ps1

# Node.js
node start.js
```

服务器将在 `http://localhost:3000` 启动。

## 使用指南

1. **上传图像**：点击上传区域或拖拽图像到上传区域
2. **查看 EXIF 数据**：系统会自动提取并显示图像的 EXIF 数据
3. **开始分析**：点击"开始研判"按钮，系统将使用 AI 分析图像内容
4. **查看结果**：分析完成后，在地图上查看推断的地理位置
5. **查看历史**：在"分析历史列表"标签页中查看之前的分析记录

## 核心功能

### AI 分析

Pinpoint 使用先进的 AI 模型（如 DeepSeek-VL2）分析图像内容，结合 EXIF 数据，推断图像的拍摄位置。分析过程包括：

- 识别图像中的视觉线索（建筑、植被、基础设施等）
- 对比 EXIF 中的 GPS 数据（如果存在）
- 逻辑推理和地理定位
- 生成详细的分析报告

### 地图显示

使用 Leaflet 地图库在交互式地图上显示推断的地理位置，支持缩放和拖动。

### EXIF 数据提取

自动提取并显示图像的 EXIF 元数据，包括：
- 相机品牌和型号
- 拍摄时间
- GPS 坐标（如果存在）
- 曝光参数

### 历史记录

保存最近的分析历史，支持：
- 查看历史分析结果
- 重新加载历史图像
- 删除历史记录

## 配置选项

在侧边栏中可以配置以下选项：

- **AI 服务提供商**：选择 SiliconFlow 或 Ollama
- **AI 模型**：选择使用的模型
- **API 密钥**：设置 SiliconFlow API 密钥
- **基础 URL**：设置 AI 服务的基础 URL

## 项目结构

```
src/
├── components/          # 前端组件
│   ├── AnalysisPanel.tsx    # 分析结果面板
│   ├── ExifPanel.tsx        # EXIF 数据面板
│   ├── HistoryList.tsx      # 历史记录列表
│   ├── ImageUploader.tsx    # 图像上传组件
│   ├── MapDisplay.tsx       # 地图显示组件
│   ├── ReportView.tsx       # 报告视图
│   └── Sidebar.tsx          # 侧边栏（设置）
├── services/           # 服务
│   └── aiService.ts         # AI 分析服务
├── utils/              # 工具函数
│   ├── cn.ts               # 类名合并工具
│   └── jsonUtils.ts        # JSON 处理工具
├── App.tsx             # 主应用组件
├── types.ts            # 类型定义
└── main.tsx            # 应用入口
```

## 许可证

本项目采用 Apache-2.0 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 注意事项

- 使用 SiliconFlow 服务需要 API 密钥
- 使用 Ollama 需要在本地安装并运行 Ollama 服务
- 分析结果的准确性取决于 AI 模型的能力和图像质量
- 大型图像可能需要更长的分析时间

---

**Pinpoint** - 让像素 归于经纬 🏠
