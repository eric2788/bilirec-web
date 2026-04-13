# Bilibili 錄製管理系統 (Bilirec Frontend)

A Progressive Web App (PWA) for managing Bilibili live stream recordings through the [bilirec](https://github.com/eric2788/bilirec) backend.

## 🚀 Features

- 📱 **Mobile-First PWA**: Install on mobile devices for a native-like experience
- 🎥 **Recording Management**: Start/stop recordings, view status and statistics
- 📁 **File Browser**: Browse and download recorded files in FLV/MP4 format
- ▶️ **MP4 Preview**: Preview MP4 recordings directly in the app
- 🔗 **File Sharing**: Share recording links/files from the file card actions
- 🔄 **Format Conversion**: Convert recordings between supported formats from the converts view
- ⚡ **Real-time Updates**: Auto-refresh recording status every 5 seconds
- 🌐 **Multi-Server Support**: Connect to different bilirec server instances
- 🔒 **JWT Authentication**: Secure login with token-based auth

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Animation**: Framer Motion
- **Icons**: Phosphor Icons

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
