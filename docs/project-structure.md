# 📁 Pingnom 專案模組分類架構

## 🏗️ 整體專案結構

```
pingnom/
├── docs/                         # 📚 專案文件
│   ├── user-stories.md          # User Stories 需求分析
│   ├── domain-design.md         # DDD 領域設計
│   ├── architecture.md          # Clean Architecture 設計
│   ├── technical-tasks.md       # 技術任務分派
│   └── project-structure.md     # 專案結構說明 (本文件)
│
├── backend/                      # 🔧 後端服務 (Golang)
├── frontend/                     # 📱 前端應用 (React Native)
├── deployments/                  # 🚀 部署配置
├── scripts/                      # 🔨 自動化腳本
├── README.md                     # 專案說明
├── .gitignore                    # Git 忽略檔案
└── CLAUDE.md                     # 開發規範
```

---

## 🔧 Backend 模組分類 (DDD + Clean Architecture)

### 📐 架構分層
```
backend/
├── cmd/                          # 🚀 應用程式進入點
│   └── api/
│       └── main.go              # API 服務器啟動
│
├── internal/                     # 🏠 內部模組 (不對外公開)
│   ├── domain/                  # 🎯 領域層 (Domain Layer)
│   ├── application/             # ⚙️ 應用層 (Application Layer)  
│   ├── interfaces/              # 🌐 介面層 (Interface Layer)
│   └── infrastructure/          # 🏗️ 基礎設施層 (Infrastructure Layer)
│
├── pkg/                         # 📦 共用套件 (可被外部使用)
├── api/                         # 📋 API 文件
├── deployments/                 # 🚀 部署配置
└── scripts/                     # 🔨 腳本工具
```

### 🎯 Domain Layer - 領域層 (按 Bounded Context 分類)

```
internal/domain/
├── user/                        # 👤 使用者管理領域
│   ├── user.go                 # User Aggregate Root
│   ├── user_profile.go         # UserProfile Value Object
│   ├── dietary_preferences.go  # DietaryPreferences Value Object
│   ├── repository.go           # UserRepository Interface
│   └── service.go              # UserService Domain Service
│
├── social/                      # 👥 社交關係領域
│   ├── friendship.go           # Friendship Aggregate Root
│   ├── group.go               # Group Aggregate Root
│   ├── group_member.go        # GroupMember Value Object
│   ├── repository.go          # Social Repository Interface
│   └── service.go             # SocialService Domain Service
│
├── ping/                        # 🍽️ 聚餐邀請領域
│   ├── ping.go                # Ping Aggregate Root
│   ├── participant.go         # Participant Value Object
│   ├── invitation.go          # Invitation Entity
│   ├── repository.go          # PingRepository Interface
│   └── service.go             # PingService Domain Service
│
├── location/                    # 📍 位置服務領域
│   ├── user_location.go       # UserLocation Aggregate Root
│   ├── meeting_point.go       # MeetingPoint Aggregate Root
│   ├── distance.go            # Distance Value Object
│   ├── repository.go          # LocationRepository Interface
│   └── service.go             # LocationService Domain Service
│
├── restaurant/                  # 🏪 餐廳服務領域
│   ├── restaurant.go          # Restaurant Aggregate Root
│   ├── recommendation.go      # Recommendation Aggregate Root
│   ├── cuisine_type.go        # CuisineType Value Object
│   ├── opening_hours.go       # OpeningHours Value Object
│   ├── repository.go          # RestaurantRepository Interface
│   └── service.go             # RestaurantService Domain Service
│
├── communication/               # 💬 溝通協調領域
│   ├── chat_session.go        # ChatSession Aggregate Root
│   ├── message.go             # Message Entity
│   ├── notification.go        # Notification Aggregate Root
│   ├── repository.go          # CommunicationRepository Interface
│   └── service.go             # CommunicationService Domain Service
│
├── payment/                     # 💰 支付分攤領域
│   ├── bill.go                # Bill Aggregate Root
│   ├── payment.go             # Payment Entity
│   ├── split_method.go        # SplitMethod Value Object
│   ├── repository.go          # PaymentRepository Interface
│   └── service.go             # PaymentService Domain Service
│
└── shared/                      # 🤝 共享值物件與事件
    ├── location.go             # Location Value Object
    ├── user_id.go             # UserId Value Object
    ├── ping_id.go             # PingId Value Object
    ├── events.go              # Domain Events
    └── errors.go              # Domain Errors
```

### ⚙️ Application Layer - 應用層

```
internal/application/
├── commands/                    # 🎯 命令處理器 (寫入操作)
│   ├── user/
│   │   ├── register_user.go    # 使用者註冊命令
│   │   ├── update_profile.go   # 更新個人檔案命令
│   │   └── update_preferences.go # 更新偏好設定命令
│   │
│   ├── social/
│   │   ├── send_friend_request.go # 發送好友邀請命令
│   │   ├── accept_friend_request.go # 接受好友邀請命令
│   │   ├── create_group.go     # 建立群組命令
│   │   └── manage_group_members.go # 管理群組成員命令
│   │
│   ├── ping/
│   │   ├── create_ping.go      # 建立Ping命令
│   │   ├── respond_to_ping.go  # 回應Ping命令
│   │   ├── select_restaurant.go # 選擇餐廳命令
│   │   └── cancel_ping.go      # 取消Ping命令
│   │
│   ├── location/
│   │   ├── update_location.go  # 更新位置命令
│   │   └── share_location.go   # 分享位置命令
│   │
│   └── communication/
│       ├── send_message.go     # 發送訊息命令
│       └── send_notification.go # 發送通知命令
│
├── queries/                     # 🔍 查詢處理器 (讀取操作)
│   ├── user/
│   │   ├── get_user_profile.go # 取得使用者檔案查詢
│   │   └── search_users.go     # 搜尋使用者查詢
│   │
│   ├── social/
│   │   ├── get_friends.go      # 取得好友列表查詢
│   │   ├── get_groups.go       # 取得群組列表查詢
│   │   └── get_friend_requests.go # 取得好友邀請查詢
│   │
│   ├── ping/
│   │   ├── get_active_pings.go # 取得活躍Ping查詢
│   │   ├── get_ping_detail.go  # 取得Ping詳情查詢
│   │   └── get_ping_history.go # 取得Ping歷史查詢
│   │
│   └── restaurant/
│       ├── get_recommendations.go # 取得餐廳推薦查詢
│       ├── search_restaurants.go # 搜尋餐廳查詢
│       └── get_restaurant_detail.go # 取得餐廳詳情查詢
│
├── services/                    # 🎼 應用服務 (跨領域協調)
│   ├── ping_orchestrator.go    # Ping流程協調服務
│   ├── notification_service.go # 通知服務
│   ├── recommendation_service.go # 推薦服務
│   └── location_calculator.go  # 位置計算服務
│
└── dto/                         # 📋 資料傳輸物件
    ├── user_dto.go             # 使用者DTO
    ├── ping_dto.go             # Ping DTO
    ├── social_dto.go           # 社交DTO
    ├── restaurant_dto.go       # 餐廳DTO
    └── location_dto.go         # 位置DTO
```

### 🌐 Interface Layer - 介面層

```
internal/interfaces/
├── http/                        # 🌍 HTTP REST API
│   ├── handlers/
│   │   ├── user_handler.go     # 使用者API處理器
│   │   ├── auth_handler.go     # 認證API處理器
│   │   ├── ping_handler.go     # Ping API處理器
│   │   ├── social_handler.go   # 社交API處理器
│   │   ├── restaurant_handler.go # 餐廳API處理器
│   │   └── location_handler.go # 位置API處理器
│   │
│   ├── middleware/
│   │   ├── auth.go            # JWT認證中間件
│   │   ├── cors.go            # CORS中間件
│   │   ├── logging.go         # 日誌中間件
│   │   ├── rate_limit.go      # 限流中間件
│   │   └── validation.go      # 輸入驗證中間件
│   │
│   └── routes/
│       └── routes.go          # 路由配置
│
├── websocket/                   # ⚡ WebSocket 即時通訊
│   ├── hub.go                 # WebSocket連接集線器
│   ├── client.go              # WebSocket客戶端
│   ├── handlers/
│   │   ├── ping_handler.go    # Ping即時事件處理器
│   │   ├── chat_handler.go    # 聊天事件處理器
│   │   └── location_handler.go # 位置事件處理器
│   │
│   └── events/
│       ├── ping_events.go     # Ping相關事件
│       └── chat_events.go     # 聊天相關事件
│
└── grpc/                        # 🔗 gRPC (未來微服務通訊)
    ├── proto/                  # Protocol Buffers定義
    └── services/              # gRPC服務實作
```

### 🏗️ Infrastructure Layer - 基礎設施層

```
internal/infrastructure/
├── persistence/                 # 💾 資料持久化
│   ├── postgres/
│   │   ├── user_repository.go  # 使用者資料庫操作
│   │   ├── ping_repository.go  # Ping資料庫操作
│   │   ├── social_repository.go # 社交資料庫操作
│   │   ├── restaurant_repository.go # 餐廳資料庫操作
│   │   ├── location_repository.go # 位置資料庫操作
│   │   └── communication_repository.go # 通訊資料庫操作
│   │
│   ├── redis/                  # ⚡ 快取與會話
│   │   ├── cache.go           # Redis快取操作
│   │   ├── session.go         # 會話管理
│   │   └── pub_sub.go         # 發布訂閱
│   │
│   └── migrations/             # 📊 資料庫遷移
│       ├── 001_create_users.sql
│       ├── 002_create_pings.sql
│       ├── 003_create_social.sql
│       ├── 004_create_restaurants.sql
│       └── 005_create_communications.sql
│
├── external/                    # 🌐 外部API整合
│   ├── google_maps.go          # Google Maps API
│   ├── google_places.go        # Google Places API
│   ├── push_notifications.go   # FCM推播通知
│   ├── oauth_providers.go      # OAuth提供者
│   └── sms_service.go          # 簡訊服務
│
├── messaging/                   # 📨 訊息與事件處理
│   ├── event_bus.go           # Domain事件匯流排
│   ├── message_queue.go       # 訊息佇列
│   └── handlers/
│       ├── ping_event_handler.go # Ping事件處理器
│       └── notification_handler.go # 通知事件處理器
│
└── config/                      # ⚙️ 配置管理
    ├── database.go             # 資料庫配置
    ├── server.go               # 服務器配置
    ├── external_apis.go        # 外部API配置
    └── redis.go                # Redis配置
```

---

## 📱 Frontend 模組分類 (Component-based Architecture)

```
frontend/
├── src/
│   ├── components/             # 🧩 可重用元件
│   │   ├── common/            # 通用基礎元件
│   │   ├── user/              # 使用者相關元件
│   │   ├── ping/              # Ping功能元件
│   │   ├── social/            # 社交功能元件
│   │   ├── restaurant/        # 餐廳相關元件
│   │   └── location/          # 位置相關元件
│   │
│   ├── screens/               # 📺 頁面元件
│   │   ├── auth/              # 認證頁面
│   │   ├── home/              # 首頁
│   │   ├── ping/              # Ping功能頁面
│   │   ├── social/            # 社交頁面
│   │   ├── restaurant/        # 餐廳頁面
│   │   └── profile/           # 個人檔案頁面
│   │
│   ├── navigation/            # 🗺️ 導航配置
│   ├── services/              # 🔧 外部服務介面
│   ├── store/                 # 🗄️ 狀態管理
│   ├── types/                 # 📝 TypeScript類型定義
│   └── utils/                 # 🛠️ 工具函數
│
├── assets/                    # 🎨 靜態資源
├── __tests__/                 # 🧪 測試檔案
└── 平台特定配置 (android/, ios/)
```

---

## 🔄 開發順序 (遵循CLAUDE.md規則)

### Phase 1: Backend 優先開發
1. **Domain Layer**: 建立核心業務邏輯
2. **Application Layer**: 實作用例與命令/查詢處理器
3. **Infrastructure Layer**: 資料庫與外部服務整合
4. **Interface Layer**: API端點實作

### Phase 2: Frontend 開發 (基於Backend API)
1. **Services**: API客戶端與外部服務整合
2. **Components**: 可重用UI元件
3. **Screens**: 頁面與使用者流程
4. **Navigation & Store**: 導航與狀態管理

### Phase 3: 整合測試與部署
1. **QA**: 端對端測試
2. **DevOps**: 部署與監控

這樣的模組分類確保了：
- ✅ **清楚的關注點分離**
- ✅ **遵循DDD最佳實踐**
- ✅ **支援團隊並行開發**
- ✅ **易於測試與維護**