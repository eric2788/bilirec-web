# Bilibili 錄製管理系統 (Bilirec Frontend)

A Progressive Web App (PWA) for managing Bilibili live stream recordings through the [bilirec](https://github.com/eric2788/bilirec) backend.

## 🚀 Features

- 📱 **Mobile-First PWA**: Install on mobile devices for a native-like experience, with responsive sidebar navigation on desktop and bottom tab bar on mobile
- 🎥 **Recording Management**: Start/stop recordings, view real-time status (`recording` / `recovering` / `idle`) and statistics
- 📡 **Live Subscription**: Subscribe to Bilibili rooms, monitor live status, and manage per-room auto-record & notification settings
- 🔔 **Web Push Notifications**: Receive push notifications for live stream events via the service worker
- 📁 **File Browser**: Browse recorded files with streaming download support (File System Access API → StreamSaver → fallback)
- ▶️ **MP4 Preview**: Preview MP4 recordings directly in the app
- 🔗 **File Sharing**: Generate shareable links for recording files with configurable expiration
- 🔄 **Format Conversion**: Submit and manage FLV/TS/FMP4 ↔ MP4 conversion tasks with cancel support
- 💾 **Disk Usage Monitoring**: Real-time disk usage display with color-coded progress bar and detailed breakdown
- 👤 **Role-Based Access Control**: Admin and Viewer roles — viewers get a read-only interface
- 🌓 **Dark Mode**: Light/dark theme toggle with system preference detection
- ⚡ **Real-time Updates**: Auto-refresh every 5 seconds with page-visibility-aware polling (pauses when tab is hidden)
- 🌐 **Multi-Server Support**: Connect to different bilirec server instances
- 🔒 **HttpOnly Cookie Auth**: Secure JWT authentication via HttpOnly cookies — no token stored in client-side JavaScript

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Package Manager**: pnpm
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Data Fetching**: SWR + TanStack React Query
- **Animation**: Framer Motion
- **Icons**: Phosphor Icons + Lucide Icons
- **Toast Notifications**: Sonner
- **PWA**: vite-plugin-pwa + custom Service Worker
- **Error Handling**: react-error-boundary
- **Streaming Download**: StreamSaver + File System Access API

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🔧 Configuration

1. Launch the app
2. Enter your bilirec server URL (supports both HTTP and HTTPS)
3. Login with your credentials
4. Start managing your recordings!

## 🌐 Backend

This frontend requires the [bilirec](https://github.com/eric2788/bilirec) backend to be running.

## 📱 PWA Installation

The app can be installed on mobile devices:

1. Open in mobile browser
2. Tap "Add to Home Screen" (iOS) or "Install" (Android)
3. Launch from your home screen like a native app

## 📄 License

MIT
