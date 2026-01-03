# Bilibili 錄製管理系統 PWA

這是一個專為 [bilirec](https://github.com/eric2788/bilirec) 後端設計的移動端優先 PWA 前端應用。

## 功能特性

- 📱 **PWA 應用** - 可安裝到手機主螢幕，如同原生應用
- 🎯 **移動端優先** - 針對手機操作優化的觸控友好界面
- 🎬 **錄製管理** - 通過房間 ID 啟動/停止 Bilibili 直播錄製
- 📊 **實時狀態** - 即時顯示錄製狀態、檔案大小、時長等信息
- 📁 **檔案瀏覽** - 查看和下載已錄製的 FLV/MP4 檔案
- 🔐 **安全認證** - 用戶名密碼登入保護
- 🌐 **離線支援** - Service Worker 提供基本離線功能

## 使用方法

### 首次使用

1. 打開應用，進入登入頁面
2. 輸入 bilirec 後端伺服器地址（例如：`http://192.168.1.100:8080`）
3. 輸入用戶名和密碼
4. 點擊「登入」按鈕

### 管理錄製任務

1. 在「錄製管理」標籤頁，點擊右上角的「添加」按鈕
2. 輸入 Bilibili 直播間房間 ID
3. 點擊「開始錄製」
4. 錄製卡片會顯示直播間信息、錄製狀態和統計數據
5. 點擊「停止錄製」按鈕結束錄製

### 下載錄製檔案

1. 切換到「錄製檔案」標籤頁
2. 瀏覽已完成的錄製檔案列表
3. 點擊檔案卡片上的「下載」按鈕
4. 選擇 FLV 或 MP4 格式下載

### 安裝為 PWA

#### iOS (Safari)
1. 打開網站
2. 點擊分享按鈕
3. 選擇「加入主畫面」
4. 確認添加

#### Android (Chrome)
1. 打開網站
2. 點擊右上角選單
3. 選擇「安裝應用程式」或「新增至主畫面」
4. 確認安裝

## 後端設置

本前端需要配合 [bilirec](https://github.com/eric2788/bilirec) 後端使用。

### API 端點（預期）

- `POST /api/auth/login` - 用戶登入
- `GET /api/records/tasks` - 獲取錄製任務列表
- `POST /api/records/start` - 開始錄製
- `POST /api/records/stop/:roomId` - 停止錄製
- `GET /api/records/files` - 獲取錄製檔案列表
- `GET /api/records/download/:fileId` - 下載檔案

### CORS 設置

確保後端允許前端域名的 CORS 請求：

```go
// 範例 CORS 設置
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"*"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

## 技術棧

- **React 19** - UI 框架
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式系統
- **shadcn/ui** - UI 組件庫
- **Axios** - HTTP 客戶端
- **Framer Motion** - 動畫效果
- **Vite** - 構建工具
- **PWA** - Service Worker + Manifest

## 開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 構建生產版本
npm run build

# 預覽生產構建
npm run preview
```

## 注意事項

- 確保手機和後端伺服器在同一網絡內，或後端具有公網訪問能力
- iOS Safari 可能需要信任自簽名證書（如使用 HTTPS）
- 大檔案下載可能需要較長時間，請保持網絡連接穩定
- 應用會每 5 秒自動刷新錄製任務狀態

## 許可證

根據原項目許可證使用
