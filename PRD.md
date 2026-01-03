# Planning Guide

一個專為 Bilibili 直播錄製系統設計的移動端優先 PWA 應用，讓用戶能輕鬆管理錄製任務並瀏覽下載錄製文件。

**Experience Qualities**:
1. **即時響應** - 錄製狀態和統計數據實時更新，讓用戶隨時掌握錄製進度
2. **觸手可及** - PWA 安裝後可從主螢幕快速啟動，如同原生應用般流暢
3. **簡潔高效** - 移動端優先設計，核心功能一觸即達，無需複雜操作

**Complexity Level**: Light Application (multiple features with basic state)
這是一個具有多個功能模塊（錄製管理、文件瀏覽、用戶認證）的輕量級應用，需要管理認證狀態和實時數據刷新，但不涉及複雜的多視圖路由或高級狀態管理。

## Essential Features

### 用戶認證
- **Functionality**: 使用用戶名和密碼登入後端伺服器
- **Purpose**: 保護後端 API 訪問權限，確保只有授權用戶可以管理錄製
- **Trigger**: 應用啟動時檢查認證狀態，未登入則顯示登入表單
- **Progression**: 顯示登入表單 → 輸入伺服器地址、用戶名和密碼 → 提交登入請求 → 接收並存儲 Token → 進入主界面
- **Success criteria**: 成功登入後可訪問所有功能，Token 持久化存儲，自動重連

### 錄製管理（網格視圖）
- **Functionality**: 通過房間 ID 啟動/停止錄製，查看錄製狀態和統計數據
- **Purpose**: 核心功能，讓用戶能輕鬆管理多個直播間的錄製任務
- **Trigger**: 點擊添加按鈕輸入房間 ID，點擊錄製卡片的控制按鈕
- **Progression**: 輸入房間 ID → 啟動錄製 → 實時顯示狀態（錄製中 recording / 恢復中 recovering / 空閒 idle） → 顯示統計數據（文件大小、時長、直播間信息） → 停止錄製
- **Success criteria**: 狀態實時更新，操作響應及時，錯誤提示清晰，支持多任務管理

### 文件瀏覽（列表視圖）
- **Functionality**: 瀏覽已錄製的文件目錄結構，支持下載 FLV/MP4 檔案
- **Purpose**: 讓用戶能查看和獲取錄製成果
- **Trigger**: 切換到文件標籤頁
- **Progression**: 顯示檔案列表 → 點擊資料夾進入 → 查看文件信息（檔名、大小、修改時間） → 點擊下載按鈕 → 下載文件
- **Success criteria**: 列表加載流暢，文件信息完整，資料夾導航順暢，下載功能可靠

### 底部導航切換
- **Functionality**: 在錄製管理和文件瀏覽之間快速切換
- **Purpose**: 移動端標準導航模式，符合用戶習慣
- **Trigger**: 點擊底部導航按鈕
- **Progression**: 點擊導航項 → 視圖平滑切換 → 突出顯示當前標籤
- **Success criteria**: 切換流暢無延遲，視覺反饋清晰

## Edge Case Handling
- **網絡錯誤** - 顯示錯誤提示，提供重試按鈕，使用 Service Worker 實現在線優先策略（online-first），離線時自動回退到緩存
- **認證過期** - 自動跳轉到登入頁面，使用 localStorage 持久化 Token 和伺服器地址
- **空狀態** - 無錄製任務時顯示引導提示，無文件時顯示友好的空狀態插圖
- **錄製錯誤** - 清晰展示錯誤信息，提供快速重試選項
- **長時間操作** - 顯示加載狀態，防止重複提交

## Design Direction
設計應傳達**專業可靠**與**輕鬆友好**的平衡感。作為工具型應用，界面需要清晰直觀，但通過活潑的色彩和流暢的動畫注入生動感，讓監控錄製任務變得輕鬆愉快。移動端大觸控區域和簡潔佈局確保單手操作的舒適性。

## Color Selection
採用 Bilibili 品牌色為靈感的活力配色方案，結合深色調營造專業感。

- **Primary Color**: 粉藍色 `oklch(0.70 0.15 240)` - Bilibili 標誌性的粉藍色調，代表品牌識別和主要操作
- **Secondary Colors**: 
  - 深灰藍 `oklch(0.25 0.02 240)` - 卡片背景和次要元素
  - 淺灰 `oklch(0.95 0.01 240)` - 頁面背景和分隔
- **Accent Color**: 亮粉色 `oklch(0.75 0.20 340)` - 錄製中狀態和重要提示，吸引注意力
- **Foreground/Background Pairings**:
  - Primary (粉藍色 oklch(0.70 0.15 240)): 白色文字 oklch(0.99 0 0) - Ratio 7.2:1 ✓
  - Accent (亮粉色 oklch(0.75 0.20 340)): 白色文字 oklch(0.99 0 0) - Ratio 6.8:1 ✓
  - Card (深灰藍 oklch(0.25 0.02 240)): 淺色文字 oklch(0.95 0.01 240) - Ratio 11.5:1 ✓
  - Background (淺灰 oklch(0.95 0.01 240)): 深色文字 oklch(0.20 0.02 240) - Ratio 12.8:1 ✓

## Font Selection
字體應具備優秀的中文顯示效果，保持現代科技感同時確保長時間閱讀的舒適性。

- **Typographic Hierarchy**:
  - H1 (應用標題): Noto Sans TC Bold / 24px / -0.02em 字距
  - H2 (區塊標題): Noto Sans TC SemiBold / 18px / -0.01em 字距
  - H3 (卡片標題): Noto Sans TC Medium / 16px / 正常字距
  - Body (正文): Noto Sans TC Regular / 14px / 1.5 行高
  - Caption (輔助信息): Noto Sans TC Regular / 12px / 1.4 行高 / 降低不透明度
  - Monospace (數據): JetBrains Mono / 13px / 用於顯示文件大小、時長等數據

## Animations
動畫應強化操作反饋和狀態變化，營造流暢的原生應用體驗。卡片切換、狀態更新使用輕柔的彈性動效（spring），錄製指示器使用脈動動畫吸引注意，底部導航切換採用快速滑動過渡，所有交互提供觸覺反饋般的即時響應。

## Component Selection
- **Components**: 
  - `Card` - 錄製任務卡片，帶陰影和懸停效果
  - `Button` - 主要操作按鈕，大觸控區域（最小 48px）
  - `Input` - 房間 ID 輸入，帶清除按鈕
  - `Badge` - 狀態標籤（錄製中/空閒/錯誤）
  - `Dialog` - 添加錄製任務彈窗
  - `Separator` - 內容分隔線
  - `ScrollArea` - 文件列表滾動容器
  - `Skeleton` - 加載狀態佔位符
  - `Avatar` - 主播頭像
  - `Alert` - 錯誤和成功提示

- **Customizations**:
  - 底部導航欄組件（自定義，固定底部，毛玻璃效果）
  - 錄製狀態指示器（自定義，脈動動畫）
  - 文件大小格式化顯示（自定義工具函數）
  - 下拉刷新組件（觸控友好）

- **States**:
  - Buttons: 默認態使用品牌色，按下時縮小 95% + 降低不透明度，禁用時灰色半透明
  - Inputs: 聚焦時邊框加粗 + 品牌色高亮，錯誤時紅色邊框 + 抖動動畫
  - Cards: 默認帶輕微陰影，觸摸時陰影加深 + 輕微上浮效果（-2px）

- **Icon Selection**:
  - `@phosphor-icons/react` 為主：
    - `Play` - 開始錄製
    - `Stop` - 停止錄製
    - `DownloadSimple` - 下載文件
    - `File` / `FileVideo` - 文件類型
    - `Plus` - 添加錄製
    - `User` - 主播信息
    - `Clock` - 時長
    - `Database` - 文件大小
    - `CaretDown` - 展開選項
    - `SignOut` - 登出

- **Spacing**:
  - 頁面邊距: `p-4` (16px)
  - 卡片間距: `gap-4` (16px)
  - 內部元素: `gap-2` (8px) 或 `gap-3` (12px)
  - 按鈕內邊距: `px-6 py-3` (24px/12px)
  - 區塊分隔: `mb-6` (24px)

- **Mobile**:
  - 使用單列網格佈局（移動端）→ 雙列網格（平板及以上）
  - 底部導航固定，內容區域預留底部安全距離（env(safe-area-inset-bottom)）
  - 觸控區域最小 48x48px，重要按鈕更大
  - 字體大小適當放大，確保可讀性
  - 卡片採用全寬設計（移動端），減少橫向滾動
  - 使用原生滾動，支持慣性滑動
  - Dialog 和 Drawer 在移動端使用底部彈出樣式
