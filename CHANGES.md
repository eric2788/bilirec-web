# 變更記錄 - Bilirec Frontend 修正

## 修正內容摘要

根據 bilirec 後端倉庫的實際 API 結構，對前端代碼進行了以下重大修正：

### 1. 數據持久化改用 localStorage（不再依賴 Spark KV）
- ✅ 創建了 `src/lib/storage.ts` 工具模組，封裝 localStorage 操作
- ✅ 更新 `App.tsx` 使用新的 storage API
- ✅ 更新 `LoginView.tsx` 移除 useKV hook，改用 localStorage
- ✅ 所有 `window.spark.kv` 調用已替換為 `storage` 調用

### 2. 修正錄製狀態枚舉（Record Status）
根據 bilirec 倉庫的實際狀態定義：
- ✅ 狀態類型從 `'recording' | 'idle' | 'error' | 'waiting'` 
- ✅ 修正為 `'recording' | 'recovering' | 'idle'`
- ✅ 更新 `RecordCard.tsx` 的狀態顯示邏輯
  - `recording` - 錄製中（脈動動畫）
  - `recovering` - 恢復中（輪廓邊框）
  - `idle` - 空閒（次要樣式）

### 3. 修正 RoomInfo 結構
根據 github.com/CuteReimu/bilibili/v2 的房間信息結構：
- ✅ 增加完整的 RoomInfo 接口定義
- ✅ 包含字段：`room_id`, `short_id`, `uid`, `title`, `cover`, `user_cover`, `keyframe`, `live_status`, `live_start_time`, `area_id`, `area_name`, `parent_area_id`, `parent_area_name`, `uname`, `face`, `description`, `online`

### 4. 修正 RecordFile 結構
根據 bilirec 倉庫的文件信息結構：
- ✅ 從 `{ path, name, size, modTime, isDir }` 
- ✅ 修正為 `{ name, size, time, isDir }`
- ✅ 更新 `FileCard.tsx` 使用正確的字段名
- ✅ 更新 `FilesView.tsx` 的 key 值使用 `name` 而非 `path`
- ✅ 時間戳處理：`time` 是 Unix 時間戳，需轉換為 Date 對象

### 5. 修正 API 路徑（移除 /api 前綴）
根據 bilirec 倉庫的實際 API 端點：
- ✅ `/api/login` → `/login`
- ✅ `/api/records` → `/records`
- ✅ `/api/records/start` → `/records/start`
- ✅ `/api/records/{roomId}/stop` → `/records/{roomId}/stop`
- ✅ `/api/files` → `/files`
- ✅ `/api/files/download?path=` → `/files/download?name=`

### 6. Service Worker 緩存策略改為在線優先（Online-First）
- ✅ 實現 Network First, Cache Fallback 策略
- ✅ 成功的網絡請求會更新緩存
- ✅ 網絡失敗時回退到緩存
- ✅ 添加緩存版本管理和清理機制
- ✅ 完整的錯誤處理和離線提示

## 技術細節

### 新增文件
- `src/lib/storage.ts` - localStorage 封裝工具

### 修改的文件
- `src/lib/types.ts` - 類型定義修正
- `src/lib/api.ts` - API 路徑修正
- `src/App.tsx` - 使用 localStorage
- `src/components/LoginView.tsx` - 移除 useKV
- `src/components/RecordCard.tsx` - 狀態處理修正
- `src/components/FileCard.tsx` - 文件結構修正
- `src/components/FilesView.tsx` - 文件列表處理
- `public/sw.js` - Service Worker 緩存策略
- `PRD.md` - 更新文檔

## 測試建議

1. **登入流程**：測試使用正確的伺服器地址和憑證登入
2. **錄製狀態**：驗證三種狀態（recording, recovering, idle）的正確顯示
3. **文件下載**：確認下載 URL 使用 `?name=` 參數
4. **離線功能**：斷網後測試 Service Worker 緩存是否生效
5. **持久化**：重新載入頁面後確認登入狀態保持

## 兼容性說明

- localStorage 支援所有現代瀏覽器
- Service Worker 需要 HTTPS 或 localhost
- PWA 功能需要有效的 manifest.json
