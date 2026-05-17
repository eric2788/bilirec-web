# Bilibili 录制管理系统 (Bilirec 前端)

一个用于通过 [bilirec](https://github.com/eric2788/bilirec) 后端管理 Bilibili 直播录制的渐进式网页应用（PWA）。

## 🚀 功能

- 📱 **移动优先的 PWA**：在移动设备上安装以获得原生应用体验，在桌面上有响应式侧边栏导航，在移动设备上有底部选项卡栏
- 🎥 **录制管理**：启动/停止录制，查看实时状态（`recording` / `recovering` / `idle`）和统计数据
- 📡 **直播订阅**：订阅 Bilibili 房间，监视直播状态，管理各房间的自动录制和通知设置
- 🔔 **网页推送通知**：通过服务工作者接收直播事件的推送通知
- 📁 **文件浏览器**：浏览录制的文件，支持流式下载（文件系统访问 API → StreamSaver → 回退）
- ▶️ **MP4 预览**：在应用中直接预览 MP4 录制
- 🔗 **文件共享**：为录制文件生成可共享链接，支持可配置的过期时间
- 🔄 **格式转换**：提交和管理 FLV/TS/FMP4 ↔ MP4 转换任务，支持取消
- 💾 **磁盘使用监测**：实时磁盘使用显示，带有颜色编码进度条和详细分解
- 👤 **基于角色的访问控制**：管理员和查看者角色 — 查看者获得只读界面
- 🌓 **深色模式**：浅色/深色主题切换，支持系统偏好检测
- ⚡ **实时更新**：每 5 秒自动刷新，考虑页面可见性（标签页隐藏时暂停）
- 🌐 **多服务器支持**：连接到不同的 bilirec 服务器实例
- 🔒 **HttpOnly Cookie 身份验证**：通过 HttpOnly Cookie 进行安全 JWT 身份验证 — 无令牌存储在客户端 JavaScript

## 🛠️ 技术栈

- **框架**：React 19 + TypeScript
- **构建工具**：Vite 7
- **包管理器**：pnpm
- **UI 库**：shadcn/ui + Radix UI
- **样式**：Tailwind CSS 4
- **HTTP 客户端**：Axios
- **数据获取**：SWR + TanStack React Query
- **动画**：Framer Motion
- **图标**：Phosphor Icons + Lucide Icons
- **Toast 通知**：Sonner
- **PWA**：vite-plugin-pwa + 自定义服务工作者
- **错误处理**：react-error-boundary
- **流式下载**：StreamSaver + 文件系统访问 API

## 📦 安装

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 为生产环境构建
pnpm build

# 预览生产构建
pnpm preview
```

## 🔧 配置

1. 打开 <https://app.bilirec.org>
2. 输入你的 bilirec 服务器 URL（必须为 HTTPS，除非是 localhost/127.0.0.1）
3. 使用你的凭证登录
4. 开始管理你的录制！

## 🌐 后端

此前端需要 [bilirec](https://github.com/eric2788/bilirec) 后端运行。

## 📱 PWA 安装

该应用可以在移动设备上安装：

1. 在移动浏览器中打开
2. 点击"添加到主屏幕"（iOS）或"安装"（Android）
3. 像原生应用一样从主屏幕启动

## 📄 许可证

MIT
