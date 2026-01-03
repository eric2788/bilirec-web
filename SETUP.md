# Setup Guide

## Prerequisites

- Node.js 18+ 
- pnpm 9+ (install with `npm install -g pnpm`)
- A running [bilirec](https://github.com/eric2788/bilirec) backend server

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 3. Login

1. Open the app in your browser
2. Enter your bilirec server URL (e.g., `http://localhost:8080` or `http://192.168.1.100:8080`)
3. Enter your username and password
4. Click "登入" (Login)

## Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

The built files will be in the `dist/` directory.

## Server Configuration

### HTTP Support

The app supports both HTTP and HTTPS connections:

- **HTTP**: `http://localhost:8080`, `http://192.168.1.100:8080`
- **HTTPS**: `https://your-domain.com`

No validation is enforced - use what works for your setup!

### Connecting to Remote Server

If your bilirec server is on another machine:

1. Find your server's IP address
2. Ensure the bilirec server is accessible from your network
3. Enter the full URL in the login form (e.g., `http://192.168.1.100:8080`)

## PWA Installation

### On Mobile (iOS/Android)

1. Open the app in your mobile browser (Safari/Chrome)
2. For iOS: Tap the Share button → "Add to Home Screen"
3. For Android: Tap the menu → "Install app" or "Add to Home Screen"
4. The app will appear on your home screen like a native app

### On Desktop

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"

## Environment Variables

No environment variables are required! The app is configured at runtime through the login form.

## Troubleshooting

### Can't Connect to Server

- Verify the server URL is correct
- Check if the bilirec server is running
- Ensure firewall allows connections on the port
- Try using the IP address instead of hostname

### Login Failed

- Verify username and password are correct
- Check the browser console for detailed error messages
- Ensure the bilirec server `/login` endpoint is working

### PWA Not Installing

- Ensure you're using HTTPS (or localhost)
- Check that `manifest.json` is accessible
- Verify service worker is registered (check DevTools → Application)

## Development

### Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   ├── LoginView.tsx
│   ├── RecordsView.tsx
│   ├── FilesView.tsx
│   └── ...
├── lib/              # Utilities
│   ├── api.ts        # API client
│   ├── storage.ts    # localStorage wrapper
│   └── types.ts      # TypeScript types
├── App.tsx           # Main app component
└── index.css         # Global styles
```

### Adding Features

1. Components go in `src/components/`
2. API methods go in `src/lib/api.ts`
3. TypeScript types go in `src/lib/types.ts`
4. Use shadcn/ui components from `src/components/ui/`

## Stack Reference

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Sonner** - Toast notifications
