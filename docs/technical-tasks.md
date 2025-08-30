# 📋 Pingnom 技術任務分派

## 🎯 Phase 1: MVP 核心功能 (4-6週) - Backend 優先開發

根據 CLAUDE.md 規則，**先寫Backend再寫Frontend**

### 🔧 Backend Developer 任務 (優先執行)

#### Sprint 1: 專案基礎建設 (1週)
**B1-001: 專案初始化與基礎架構**
- [ ] 建立 Golang 專案結構 (Clean Architecture)
- [ ] 設定 PostgreSQL 資料庫連線
- [ ] 實作基礎 middleware (CORS, Logging, Error Handling)
- [ ] 設定環境配置管理 (Viper)
- [ ] 建立 Docker 開發環境

**B1-002: 使用者管理領域實作**
- [ ] 實作 User Aggregate 與 Value Objects
- [ ] 建立使用者資料庫 Schema 與 Migration
- [ ] 實作 UserRepository (PostgreSQL)
- [ ] 建立使用者註冊 Command Handler
- [ ] 實作 JWT Authentication Service

#### Sprint 2: 核心 Ping 功能 (2週)
**B1-003: Ping 領域模型實作**
- [ ] 設計並實作 Ping Aggregate Root
- [ ] 建立 Ping 相關資料庫 Schema
- [ ] 實作 PingRepository 介面與實作
- [ ] 建立 CreatePing Command Handler
- [ ] 實作 RespondToPing Command Handler

**B1-004: 社交關係功能**
- [ ] 實作 Friendship Aggregate
- [ ] 建立朋友關係資料庫設計
- [ ] 實作好友邀請與接受邏輯
- [ ] 建立群組管理功能
- [ ] 實作社交關係查詢 API

#### Sprint 3: 位置與推薦服務 (1週)
**B1-005: 位置服務整合**
- [ ] 整合 Google Maps Geocoding API
- [ ] 實作 LocationService 距離計算
- [ ] 建立最佳會面點算法
- [ ] 實作位置更新與分享功能

**B1-006: 基礎餐廳推薦**
- [ ] 建立餐廳資料模型
- [ ] 整合 Google Places API
- [ ] 實作基礎推薦演算法
- [ ] 建立推薦結果 API

#### Sprint 4: API 完善與測試 (1週)
**B1-007: RESTful API 實作**
- [ ] 建立完整的 HTTP Handlers
- [ ] 實作 API 輸入驗證
- [ ] 建立 OpenAPI 規格文件
- [ ] 實作錯誤處理與狀態回應

**B1-008: 測試與部署準備**
- [ ] 撰寫單元測試 (Domain Layer)
- [ ] 撰寫整合測試 (Application Layer)
- [ ] 建立 CI/CD Pipeline 基礎
- [ ] 準備 Production 部署配置

---

### 📱 Frontend Developer 任務 (Backend完成API後執行)

#### Sprint 1: 專案設定與基礎元件 (1週)
**F1-001: React Native 專案初始化**
- [ ] 建立 Expo React Native 專案
- [ ] 設定 TypeScript 配置
- [ ] 建立專案資料夾結構
- [ ] 設定 Redux Toolkit 狀態管理
- [ ] 配置 Navigation (React Navigation 6)

**F1-002: 共用元件開發**
- [ ] 建立設計系統基礎 (Colors, Typography, Spacing)
- [ ] 實作基礎 UI 元件 (Button, Input, Card)
- [ ] 建立 Loading 與 Error 狀態元件
- [ ] 實作使用者頭像元件
- [ ] 設定圖示與字體資源

#### Sprint 2: 認證與個人檔案功能 (2週)
**F1-003: 使用者認證流程**
- [ ] 建立登入註冊頁面 UI
- [ ] 實作 Auth API 整合
- [ ] 建立 JWT Token 管理
- [ ] 實作登入狀態持久化
- [ ] 建立受保護路由機制

**F1-004: 個人檔案管理**
- [ ] 建立個人檔案編輯頁面
- [ ] 實作頭像上傳功能
- [ ] 建立飲食偏好設定介面
- [ ] 實作位置權限要求
- [ ] 建立隱私設定頁面

#### Sprint 3: 核心 Ping 功能 UI (2週)
**F1-005: Ping 建立與管理**
- [ ] 建立 Ping 建立表單
- [ ] 實作朋友/群組選擇器
- [ ] 建立時間選擇器介面
- [ ] 實作 Ping 邀請發送
- [ ] 建立 Ping 狀態顯示

**F1-006: Ping 回應與參與**
- [ ] 建立 Ping 邀請通知 UI
- [ ] 實作邀請回應介面 (接受/拒絕)
- [ ] 建立活躍 Ping 列表頁面
- [ ] 實作參與者狀態顯示
- [ ] 建立 Ping 詳情頁面

#### Sprint 4: 地圖與餐廳推薦 (1週)
**F1-007: 地圖整合**
- [ ] 整合 React Native Maps
- [ ] 實作當前位置獲取
- [ ] 建立地圖上的餐廳標記
- [ ] 實作位置分享開關
- [ ] 建立路線指引功能

**F1-008: 餐廳推薦介面**
- [ ] 建立餐廳卡片元件
- [ ] 實作餐廳列表頁面
- [ ] 建立餐廳篩選功能
- [ ] 實作餐廳詳情頁面
- [ ] 建立餐廳選擇確認流程

---

### 🧪 QA Engineer 任務

#### Sprint 1-2: 測試環境建置 (2週)
**Q1-001: 測試框架建置**
- [ ] 建立後端單元測試框架 (Go testing + Testify)
- [ ] 設定前端測試環境 (Jest + React Native Testing Library)
- [ ] 建立測試資料庫環境
- [ ] 設定 API 測試工具 (Postman/Newman)
- [ ] 建立自動化測試 Pipeline

**Q1-002: API 測試套件**
- [ ] 撰寫使用者認證 API 測試
- [ ] 建立 Ping CRUD 操作測試
- [ ] 實作社交功能 API 測試
- [ ] 建立位置服務 API 測試
- [ ] 撰寫餐廳推薦 API 測試

#### Sprint 3-4: 整合測試與 E2E 測試 (2週)
**Q1-003: Mobile App 測試**
- [ ] 建立元件單元測試
- [ ] 實作使用者流程測試
- [ ] 建立 API 整合測試
- [ ] 實作狀態管理測試
- [ ] 建立導航流程測試

**Q1-004: 端對端測試**
- [ ] 使用 Detox 建立 E2E 測試框架
- [ ] 撰寫使用者註冊登入流程測試
- [ ] 建立完整 Ping 流程測試 (建立→邀請→回應→選餐廳)
- [ ] 實作社交功能 E2E 測試
- [ ] 建立效能測試基準

---

### 🚀 DevOps Engineer 任務

#### Sprint 1-2: 基礎設施建置 (2週)
**D1-001: 開發環境容器化**
- [ ] 建立 Golang API Dockerfile
- [ ] 設定 PostgreSQL Docker Compose
- [ ] 建立 Redis 快取容器
- [ ] 設定開發環境一鍵啟動
- [ ] 建立環境變數管理

**D1-002: CI/CD Pipeline 建置**
- [ ] 設定 GitHub Actions Workflow
- [ ] 建立自動測試 Pipeline
- [ ] 實作程式碼品質檢查 (SonarQube/CodeQL)
- [ ] 設定自動 Docker 映像建置
- [ ] 建立部署腳本

#### Sprint 3-4: 部署與監控 (2週)
**D1-003: Production 環境準備**
- [ ] 設定雲端資料庫 (AWS RDS/GCP Cloud SQL)
- [ ] 建立 Kubernetes 部署配置
- [ ] 設定負載均衡與 Auto Scaling
- [ ] 實作 SSL/TLS 證書管理
- [ ] 建立備份與災難恢復機制

**D1-004: 監控與日誌系統**
- [ ] 建立應用程式健康檢查
- [ ] 設定 Prometheus 監控指標
- [ ] 建立 Grafana 監控儀表板
- [ ] 實作集中式日誌收集 (ELK Stack)
- [ ] 設定警報與通知機制

---

## 📅 Phase 1 時程規劃 (Backend 優先)

### 🔧 Backend 優先階段 (前4週)
| 週次 | Backend (優先) | DevOps (支援) | QA (準備) |
|------|----------------|---------------|-----------|
| 第1週 | B1-001, B1-002 | D1-001 | Q1-001 |
| 第2週 | B1-003 | D1-001 | Q1-001 |
| 第3週 | B1-003, B1-004 | D1-002 | Q1-002 |
| 第4週 | B1-005, B1-006, B1-007 | D1-002 | Q1-002 |

### 📱 Frontend 開發階段 (第5-8週)
| 週次 | Frontend (主要) | Backend (支援) | QA (測試) | DevOps (整合) |
|------|----------------|----------------|-----------|---------------|
| 第5週 | F1-001, F1-002 | B1-008 API優化 | Q1-003 | D1-003 |
| 第6週 | F1-003, F1-004 | API Bug修復 | Q1-003 | D1-003 |
| 第7週 | F1-005, F1-006 | API擴展功能 | Q1-004 | D1-004 |
| 第8週 | F1-007, F1-008 | 整合支援 | Q1-004 | D1-004 |

---

## ⚡ 跨團隊協作要點

### 🤝 溝通協調
- **每日 Stand-up**: 同步進度與阻礙
- **Sprint Planning**: 每週任務規劃與分工
- **API First**: Backend 優先完成 API 設計，Frontend 依此開發
- **Mock Data**: Frontend 使用 Mock API 並行開發

### 🔄 整合測試里程碑
- **Week 2**: 使用者認證功能完整整合測試
- **Week 4**: Ping 核心流程端對端測試
- **Week 6**: MVP 功能完整系統測試

### 📝 文件交付要求
- Backend: API 文件 (OpenAPI) + 資料庫 Schema
- Frontend: 元件文件 + 使用者流程圖
- QA: 測試計劃 + 缺陷報告 + 測試覆蓋率報告
- DevOps: 部署文件 + 監控儀表板 + 災難恢復程序

---

## 🎯 Phase 2 預告 (Week 7-12)
- 即時通訊與 WebSocket 整合
- 進階餐廳推薦演算法
- 推播通知系統
- 帳單分攤功能
- 效能優化與擴容規劃