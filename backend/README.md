# Pingnom Backend API

基於 Golang 的 RESTful API 服務，採用 Clean Architecture 和 Domain-Driven Design (DDD) 設計原則。

## 🏗️ 架構設計

### Clean Architecture 分層
- **Domain Layer**: 業務邏輯與核心實體
- **Application Layer**: 用例協調與應用服務  
- **Interface Layer**: HTTP API 與外部介面
- **Infrastructure Layer**: 資料庫與外部服務整合

### DDD Bounded Contexts
- **User Management**: 使用者註冊、認證、檔案管理
- **Social**: 朋友關係與群組管理 (未來實作)
- **Ping**: 聚餐邀請核心功能 (未來實作)
- **Location**: 位置服務與地理計算 (未來實作)
- **Restaurant**: 餐廳推薦系統 (未來實作)

## 🚀 快速開始

### 環境需求
- Go 1.21+
- PostgreSQL 12+
- (可選) Docker & Docker Compose

### 本地開發

1. **安裝依賴**
```bash
go mod tidy
```

2. **設定資料庫**
```bash
# 使用 Docker Compose 啟動 PostgreSQL
docker-compose up -d postgres

# 或手動建立資料庫
createdb pingnom_dev
```

3. **設定環境變數**
```bash
# 複製配置檔案
cp configs/config.yaml.example configs/config.yaml

# 或使用環境變數
export PINGNOM_DATABASE_PASSWORD=your_password
export PINGNOM_JWT_SECRET=your_secret_key
```

4. **啟動服務**
```bash
go run cmd/api/main.go
```

API 將在 `http://localhost:8080` 啟動

## 📋 API 端點

### 健康檢查
- `GET /health` - 服務健康狀態

### 使用者管理
- `POST /api/v1/users/register` - 註冊新使用者
- `GET /api/v1/users/profile` - 取得使用者檔案 (需認證)
- `PUT /api/v1/users/profile` - 更新使用者檔案 (需認證)  
- `PUT /api/v1/users/password` - 變更密碼 (需認證)
- `GET /api/v1/users/search` - 搜尋使用者

### 認證
- 使用 JWT Bearer Token
- Header: `Authorization: Bearer <token>`

## 🗄️ 資料庫

### 架構
使用 GORM 進行 ORM 映射，支援自動遷移。

### 遷移
```bash
# 開發環境自動遷移
go run cmd/api/main.go

# 手動遷移 (未來實作)
go run cmd/migrate/main.go
```

## 🧪 測試

```bash
# 執行所有測試
go test ./...

# 執行特定套件測試
go test ./internal/domain/user

# 產生測試覆蓋率報告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 📦 部署

### Docker
```bash
# 建置映像
docker build -t pingnom-api .

# 啟動服務
docker-compose up
```

### 環境變數配置
| 變數 | 說明 | 預設值 |
|-----|------|--------|
| `PINGNOM_ENVIRONMENT` | 執行環境 | development |
| `PINGNOM_SERVER_PORT` | 服務埠號 | 8080 |
| `PINGNOM_DATABASE_HOST` | 資料庫主機 | localhost |
| `PINGNOM_DATABASE_PASSWORD` | 資料庫密碼 | password |
| `PINGNOM_JWT_SECRET` | JWT 金鑰 | (必須設定) |

## 🔧 開發工具

### 程式碼格式化
```bash
gofmt -s -w .
```

### 靜態分析
```bash
go vet ./...
golangci-lint run
```

### API 文件
- Swagger/OpenAPI 規格: `api/openapi.yaml` (未來實作)
- Postman Collection: `api/postman_collection.json` (未來實作)

## 📁 專案結構

```
backend/
├── cmd/api/              # 應用程式進入點
├── internal/             # 私有應用程式程式碼
│   ├── domain/          # 領域層
│   ├── application/     # 應用層
│   ├── interfaces/      # 介面層
│   └── infrastructure/  # 基礎設施層
├── pkg/                 # 公共程式庫
├── configs/             # 配置檔案
├── api/                 # API 文件
└── scripts/             # 建置與部署腳本
```

## 🤝 開發規範

### Git Commit 訊息
- `[Feature Addition]`: 新增功能
- `[Bug Fixing]`: 修復錯誤  
- `[Optimization]`: 效能優化
- `[Refactoring]`: 程式碼重構

### 程式碼風格
- 遵循 Go 官方程式碼風格指南
- 使用依賴注入模式
- 介面優於實作
- 錯誤處理明確且一致

## 📄 授權
MIT License