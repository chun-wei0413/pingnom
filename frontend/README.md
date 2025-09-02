# Pingnom Mobile App

基於 React Native + Expo 的社交用餐應用，與 Golang Backend API 完美整合。

## 🚀 快速開始

### 環境需求
- Node.js 16+
- Expo CLI
- iOS Simulator 或 Android Emulator
- Backend API 服務運行中

### 本地開發

1. **安裝依賴**
```bash
cd frontend
npm install
```

2. **啟動開發服務器**
```bash
npm start
```

3. **在模擬器中運行**
```bash
# iOS
npm run ios

# Android
npm run android

# Web (開發用)
npm run web
```

## 📱 功能特色

### ✅ 已實作功能
- **使用者註冊**: 完整的註冊表單與驗證
- **使用者介面**: 現代化的 UI 元件庫
- **狀態管理**: Redux Toolkit 整合
- **導航系統**: React Navigation 6
- **類型安全**: 完整的 TypeScript 支援
- **API 整合**: 與 Backend 的完整整合

### 🚧 開發中功能
- 使用者登入 (Backend 認證待完成)
- Ping 建立與管理
- 朋友系統
- 餐廳推薦
- 即時通訊

## 🏗️ 架構設計

### 資料夾結構
```
src/
├── components/        # 可重用 UI 元件
│   ├── common/       # 通用基礎元件
│   └── user/         # 使用者相關元件
├── screens/          # 頁面元件
│   ├── auth/         # 認證頁面
│   └── home/         # 主頁面
├── navigation/       # 導航配置
├── services/         # API 與外部服務
├── store/           # Redux 狀態管理
├── types/           # TypeScript 類型定義
└── utils/           # 工具函數
```

### 技術棧
- **Framework**: React Native + Expo Go
- **語言**: TypeScript
- **狀態管理**: Redux Toolkit
- **導航**: React Navigation 6
- **HTTP 客戶端**: Axios
- **UI 庫**: React Native Paper + 自定義元件

## 🎨 UI/UX 設計

### 設計系統
- **主色調**: Orange (#FF6B35) - 代表活力與溫暖
- **字體**: iOS 系統字體 / Android Roboto
- **圓角**: 12px 統一圓角設計
- **間距**: 4px 基礎間距系統

### 元件庫
- `Button`: 多種變體 (primary, outline, text)
- `Input`: 完整輸入元件 (驗證、圖示、錯誤狀態)
- `Loading`: 載入指示器
- 更多元件開發中...

## 🔌 API 整合

### 端點配置
- **開發環境**: http://localhost:8080/api/v1
- **認證方式**: JWT Bearer Token
- **錯誤處理**: 統一錯誤回應格式

### 已整合 API
- `POST /users/register` - 使用者註冊
- `GET /users/search` - 搜尋使用者
- `GET /health` - 健康檢查

### API 狀態管理
- Redux Toolkit 管理 API 狀態
- 自動錯誤處理與載入狀態
- Token 自動管理

## 📱 頁面導覽

### 認證流程
1. **歡迎頁面** - 應用介紹與功能展示
2. **註冊頁面** - 使用者註冊表單
3. **登入頁面** - 使用者登入 (開發中)

### 主應用
1. **首頁** - 快速操作與活動總覽
2. **Pings** - 聚餐邀請管理 (開發中)
3. **朋友** - 社交關係管理 (開發中)
4. **個人** - 使用者檔案與設定 (開發中)

## 🧪 測試

### 🤖 UI 測試 - Robot Framework (主要)

使用 BDD (行為驅動開發) 風格的 Robot Framework 進行 UI 測試：

```bash
# 進入測試目錄
cd tests/robot

# 執行所有 BDD 測試 (推薦)
./run_tests.sh        # Linux/macOS
run_tests.bat          # Windows

# 執行特定標籤測試
robot --outputdir results --include smoke features/        # 冒煙測試
robot --outputdir results --include critical features/     # 關鍵測試
robot --outputdir results --include integration features/  # 整合測試

# 執行特定測試檔案  
robot --outputdir results features/friend_system.robot
robot --outputdir results features/friend_request_flow.robot
```

**測試報告位置**: `tests/robot/results/`
- `report.html` - 主要測試報告
- `log.html` - 詳細測試日誌
- 截圖檔案 - 測試過程截圖

### 📱 Mobile 測試 - Appium (原生功能)

用於 React Native Mobile App 的真機和模擬器測試：

```bash
# 進入 Appium 測試目錄
cd tests/appium

# 執行 iOS 測試
robot --outputdir results --variable PLATFORM:iOS features/

# 執行 Android 測試
robot --outputdir results --variable PLATFORM:Android features/

# 執行特定標籤測試
robot --outputdir results --include mobile features/
```

### 🧪 測試架構

```
tests/
├── robot/                    # Robot Framework BDD 測試 (Web)
│   ├── features/            # BDD 場景檔案
│   │   ├── friend_system.robot
│   │   └── friend_request_flow.robot
│   ├── keywords/            # 測試關鍵字
│   ├── variables/           # 測試配置
│   ├── results/             # 測試報告 (執行時生成)
│   └── README.md           # 詳細使用說明
└── appium/                  # Appium Mobile 測試
    ├── features/            # Mobile BDD 場景
    ├── keywords/            # Mobile 測試關鍵字
    ├── capabilities/        # 設備配置檔案
    └── results/             # Mobile 測試報告
```

### 🎯 BDD 場景範例

```robot
場景: 用戶能夠成功登入並訪問朋友頁面
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我使用有效的帳號登入
    ...    我應該能夠成功進入應用程式並訪問朋友功能
    [Tags]    smoke    login    friends
    
    Given 我是一個註冊用戶 Frank Li
    When 我使用我的帳號登入
    Then 我應該看到歡迎訊息
    And 我應該能夠訪問朋友頁面
```

### 📊 單元測試

```bash
# 執行所有單元測試
npm test

# 執行特定測試
npm test Button

# 產生測試覆蓋率
npm run test:coverage
```

## 📦 建置與部署

### 開發建置
```bash
# 建立開發版本
expo build:android
expo build:ios
```

### 生產建置
```bash
# 建立生產版本
expo build:android --release-channel production
expo build:ios --release-channel production
```

## 🔧 配置

### 環境變數
- 建立 `.env` 檔案配置環境變數
- API 端點配置
- 認證設定

### 路徑別名
```typescript
'@/*': 'src/*'
'@/components/*': 'src/components/*'
'@/screens/*': 'src/screens/*'
// 等等...
```

## 🚀 開發狀態

### 當前版本: v1.0.0-alpha

#### ✅ 完成功能
- [x] 專案基礎架構
- [x] UI 元件庫
- [x] 註冊流程
- [x] Redux 狀態管理
- [x] API 整合框架

#### 🔄 進行中
- [ ] 使用者登入
- [ ] 個人檔案管理

#### 📋 待開發
- [ ] Ping 功能
- [ ] 朋友系統
- [ ] 餐廳推薦
- [ ] 推播通知

## 🤝 開發規範

### Git Commit 訊息
- `[Feature Addition]`: 新增功能
- `[Bug Fixing]`: 修復錯誤
- `[Optimization]`: 效能優化
- `[Refactoring]`: 程式碼重構

### 程式碼風格
- ESLint + Prettier 自動格式化
- TypeScript 嚴格模式
- 函數式元件 + Hooks
- 一致的命名規範

---

**Made with 🧡 for food lovers who miss their friends**