# 🛠️ Pingnom 開發環境設置指南

## 📋 快速啟動

### 🚀 手動啟動開發環境 (推薦)
```bash
# 終端 1: 啟動後端 API 服務
cd backend
go run cmd/api/main_inmemory_with_groups.go

# 終端 2: 啟動前端 React Native 服務
cd frontend-mobile
npm start
```

### ⏹️ 停止開發環境
```bash
# 在各自終端使用 Ctrl+C 停止服務
```

## 🔧 開發環境配置

### 📂 環境變數設置
- **Frontend**: `frontend-mobile/.env` (已自動創建)
- **Backend**: `backend/.env.example` (複製並修改為 `.env`)

### 🔨 必要工具版本
- **Node.js**: v18 或以上
- **Go**: v1.21 或以上
- **Expo CLI**: `npm install -g expo-cli`

## 🌐 服務端點

| 服務 | 端口 | 網址 | 用途 |
|------|------|------|------|
| **Backend API** | 8090 | http://localhost:8090 | REST API |
| **Frontend Mobile** | 8081 | http://localhost:8081 | React Native + Expo |
| **Health Check** | 8090 | http://localhost:8090/health | 系統健康狀態 |

## 🧪 測試帳號

### 開發環境測試用戶
| 帳號 | Email | 密碼 | 角色 |
|------|-------|------|------|
| **Frank Li** | `testuser@pingnom.app` | `TestPassword2024!` | 主要創建者 |
| **Alice Wang** | `alice@pingnom.app` | `AlicePassword2024!` | 回應者 |

### 快速登入功能
- ✅ 開發模式下啟用快速登入按鈕
- ✅ 一鍵切換測試帳號
- ✅ 自動填入認證資訊

## 🔍 開發狀態監控

### 系統健康檢查
```bash
# 檢查後端 API 狀態
curl http://localhost:8090/health

# 檢查前端是否運行
curl http://localhost:8081
```

### 常見端口衝突解決
```bash
# 檢查端口使用狀況
netstat -ano | findstr :8090
netstat -ano | findstr :8081

# 強制停止特定端口的程序
taskkill /f /pid <PID>
```

## 📱 移動端開發

### Expo 開發服務器
```bash
cd frontend-mobile
npm start                 # 啟動開發服務器
expo start --clear        # 清除緩存啟動
expo start --android      # 直接在 Android 上啟動
expo start --ios          # 直接在 iOS 上啟動
```

### 設備測試
1. 安裝 **Expo Go** 應用
2. 掃描終端機中的 QR Code
3. 確保手機與電腦在同一 WiFi 網路

## 🗄️ 資料庫設置

### 開發環境 (InMemory)
- ✅ 自動創建測試數據
- ✅ 重啟後自動重建
- ✅ 無需額外設置

### 生產環境準備 (PostgreSQL)
```bash
# 創建資料庫
createdb pingnom

# 配置環境變數
cp backend/.env.example backend/.env
# 編輯 backend/.env 中的資料庫連線設置
```

## ⚡ 性能優化

### 依賴版本管理
```bash
cd frontend-mobile
npx expo install --fix    # 自動修復版本相容性
npm audit fix              # 修復安全漏洞
```

### 開發服務器優化
- ✅ 自動修復 Expo SDK 版本相容性
- ✅ 清理重複背景程序
- ✅ 優化端口使用

## 🚨 常見問題

### 1. 前端無法連接後端
- 檢查後端是否在 8090 端口運行
- 確認 `.env` 中的 API URL 正確
- 檢查防火牆設置

### 2. Expo 應用無法載入
- 確保手機與電腦在同一網路
- 嘗試清除 Expo Go 緩存
- 重新啟動 Metro Bundler

### 3. 端口被佔用錯誤
```bash
# 使用開發腳本自動清理
scripts\dev-stop.bat

# 或手動找出並停止衝突程序
```

### 4. 依賴版本不相容
```bash
cd frontend-mobile
npx expo install --fix
```

## 📋 開發檢查清單

### ✅ 每次開發前
- [ ] 檢查 Git 狀態 (`git status`)
- [ ] 拉取最新代碼 (`git pull`)
- [ ] 檢查依賴更新 (`npm outdated`)

### ✅ 功能開發後
- [ ] 運行測試套件 (`npm test`)
- [ ] 檢查代碼風格 (`npm run lint`)
- [ ] 驗證 API 端點正常運作
- [ ] 測試移動端功能

### ✅ 提交代碼前
- [ ] 運行完整測試
- [ ] 清理暫存文件
- [ ] 檢查沒有機密資訊被提交

---

## 🎯 下一步開發重點

1. **實作實時通知系統 (WebSocket + Push Notifications)**
2. **活動歷史與統計分析功能**
3. **餐廳評分與評論系統**
4. **實時聊天功能整合**
5. **準備生產環境部署 (PostgreSQL + 雲端服務)**

---

**Made with 🧡 by Pingnom Development Team**