# 🏛️ Pingnom Clean Architecture Design

## 📐 整體架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   Mobile App    │  │        Admin Dashboard         ││
│  │ (React Native)  │  │         (Web React)            ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Interface Layer                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   REST APIs     │  │      WebSocket APIs            ││
│  │   (Gin HTTP)    │  │   (Socket.io/gorilla/ws)       ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │  Use Cases /    │  │     Application Services       ││
│  │  Command/Query  │  │   (Orchestration Logic)        ││
│  │   Handlers      │  │                                ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Domain Layer                           │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   Aggregates    │  │        Domain Services         ││
│  │   Entities      │  │      Business Rules            ││
│  │  Value Objects  │  │       Domain Events            ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│               Infrastructure Layer                      │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   PostgreSQL    │  │      External APIs             ││
│  │   Repository    │  │ (Google Maps, Push Notifications)││
│  │                 │  │                                ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 📁 專案結構規劃

### Backend (Golang) 結構
```
pingnom-backend/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── domain/                    # Domain Layer
│   │   ├── user/
│   │   │   ├── user.go           # User Aggregate
│   │   │   ├── repository.go     # User Repository Interface
│   │   │   └── service.go        # User Domain Service
│   │   ├── social/
│   │   │   ├── friendship.go     
│   │   │   ├── group.go          
│   │   │   └── repository.go     
│   │   ├── ping/
│   │   │   ├── ping.go           # Ping Aggregate Root
│   │   │   ├── participant.go    # Value Object
│   │   │   └── repository.go     
│   │   ├── location/
│   │   │   ├── user_location.go  
│   │   │   ├── meeting_point.go  
│   │   │   └── service.go        
│   │   ├── restaurant/
│   │   │   ├── restaurant.go     
│   │   │   ├── recommendation.go 
│   │   │   └── service.go        
│   │   └── shared/               # Shared Value Objects
│   │       ├── location.go       
│   │       ├── user_id.go        
│   │       └── events.go         
│   │
│   ├── application/               # Application Layer
│   │   ├── commands/             # Command Handlers
│   │   │   ├── user/
│   │   │   │   ├── register_user.go
│   │   │   │   └── update_profile.go
│   │   │   ├── ping/
│   │   │   │   ├── create_ping.go
│   │   │   │   └── respond_ping.go
│   │   │   └── social/
│   │   │       ├── send_friend_request.go
│   │   │       └── create_group.go
│   │   ├── queries/              # Query Handlers
│   │   │   ├── user/
│   │   │   │   └── get_user_profile.go
│   │   │   ├── ping/
│   │   │   │   └── get_active_pings.go
│   │   │   └── restaurant/
│   │   │       └── get_recommendations.go
│   │   ├── services/             # Application Services
│   │   │   ├── ping_orchestrator.go
│   │   │   ├── notification_service.go
│   │   │   └── recommendation_service.go
│   │   └── dto/                  # Data Transfer Objects
│   │       ├── user_dto.go
│   │       ├── ping_dto.go
│   │       └── restaurant_dto.go
│   │
│   ├── interfaces/               # Interface Layer
│   │   ├── http/
│   │   │   ├── handlers/
│   │   │   │   ├── user_handler.go
│   │   │   │   ├── ping_handler.go
│   │   │   │   ├── social_handler.go
│   │   │   │   └── restaurant_handler.go
│   │   │   ├── middleware/
│   │   │   │   ├── auth.go
│   │   │   │   ├── cors.go
│   │   │   │   └── logging.go
│   │   │   └── routes/
│   │   │       └── routes.go
│   │   ├── websocket/
│   │   │   ├── hub.go            # WebSocket Connection Hub
│   │   │   ├── client.go         # WebSocket Client
│   │   │   └── handlers/
│   │   │       ├── ping_handler.go
│   │   │       └── chat_handler.go
│   │   └── grpc/                 # Future microservice communication
│   │
│   └── infrastructure/           # Infrastructure Layer
│       ├── persistence/
│       │   ├── postgres/
│       │   │   ├── user_repository.go
│       │   │   ├── ping_repository.go
│       │   │   ├── social_repository.go
│       │   │   └── restaurant_repository.go
│       │   ├── redis/            # Caching & Session
│       │   │   ├── cache.go
│       │   │   └── session.go
│       │   └── migrations/
│       │       ├── 001_create_users.sql
│       │       ├── 002_create_pings.sql
│       │       └── 003_create_restaurants.sql
│       ├── external/
│       │   ├── google_maps.go    # Google Maps API
│       │   ├── push_notifications.go
│       │   └── oauth_providers.go
│       ├── messaging/
│       │   ├── event_bus.go      # Domain Events
│       │   └── message_queue.go  # Background Jobs
│       └── config/
│           ├── database.go
│           ├── server.go
│           └── external_apis.go
├── pkg/                          # Shared Packages
│   ├── logger/
│   ├── validator/
│   ├── crypto/
│   └── utils/
├── api/                          # API Documentation
│   ├── openapi.yaml
│   └── postman_collection.json
├── deployments/
│   ├── docker/
│   │   └── Dockerfile
│   └── k8s/
│       ├── deployment.yaml
│       └── service.yaml
├── scripts/
│   ├── migrate.sh
│   └── seed_data.sh
├── go.mod
├── go.sum
└── README.md
```

### Frontend (React Native) 結構
```
pingnom-mobile/
├── src/
│   ├── components/               # Reusable UI Components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── user/
│   │   │   ├── UserAvatar.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── ping/
│   │   │   ├── PingCard.tsx
│   │   │   ├── ParticipantList.tsx
│   │   │   └── CreatePingForm.tsx
│   │   └── restaurant/
│   │       ├── RestaurantCard.tsx
│   │       └── RestaurantList.tsx
│   │
│   ├── screens/                  # Screen Components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── ping/
│   │   │   ├── CreatePingScreen.tsx
│   │   │   ├── PingDetailScreen.tsx
│   │   │   └── ActivePingsScreen.tsx
│   │   ├── social/
│   │   │   ├── FriendsScreen.tsx
│   │   │   ├── GroupsScreen.tsx
│   │   │   └── AddFriendScreen.tsx
│   │   ├── restaurant/
│   │   │   ├── RestaurantListScreen.tsx
│   │   │   └── RestaurantDetailScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── navigation/               # Navigation Configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   │
│   ├── services/                 # External Service Interfaces
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── userApi.ts
│   │   │   ├── pingApi.ts
│   │   │   ├── socialApi.ts
│   │   │   └── restaurantApi.ts
│   │   ├── websocket/
│   │   │   ├── socketClient.ts
│   │   │   └── socketHandlers.ts
│   │   ├── location/
│   │   │   └── locationService.ts
│   │   └── notifications/
│   │       └── pushNotifications.ts
│   │
│   ├── store/                    # State Management
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── pingSlice.ts
│   │   │   ├── socialSlice.ts
│   │   │   └── restaurantSlice.ts
│   │   ├── middleware/
│   │   │   └── apiMiddleware.ts
│   │   └── store.ts
│   │
│   ├── types/                    # TypeScript Type Definitions
│   │   ├── user.ts
│   │   ├── ping.ts
│   │   ├── social.ts
│   │   ├── restaurant.ts
│   │   └── api.ts
│   │
│   └── utils/                    # Utility Functions
│       ├── validation.ts
│       ├── formatting.ts
│       ├── dateHelpers.ts
│       └── locationHelpers.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── __tests__/
├── android/
├── ios/
├── package.json
└── README.md
```

---

## 🔄 依賴關係與資料流

### 依賴方向 (遵循 Clean Architecture)
```
Presentation → Interface → Application → Domain ← Infrastructure
```

### 典型請求流程
1. **React Native App** → HTTP Request
2. **HTTP Handler** → 驗證輸入，調用 Application Service
3. **Application Service** → 協調多個 Domain Services 和 Repositories
4. **Domain Service** → 執行業務邏輯
5. **Repository** → 資料持久化
6. **Domain Events** → 觸發跨領域操作
7. **Response** → 回傳到 App

### WebSocket 即時通訊流程
1. **WebSocket Connection** → 建立長連接
2. **Event Handlers** → 處理即時事件
3. **Message Broadcasting** → 多人同步狀態更新
4. **State Synchronization** → App 狀態即時同步

---

## 🔌 技術選擇與整合點

### Backend 技術棧
- **Web Framework**: Gin (HTTP), Gorilla WebSocket (WebSocket)
- **Database**: PostgreSQL (主要資料), Redis (快取/Session)
- **ORM**: GORM 
- **Authentication**: JWT + OAuth 2.0
- **Message Queue**: 考慮使用 RabbitMQ 或 Apache Kafka
- **Logging**: Logrus/Zap
- **Testing**: Testify

### Frontend 技術棧  
- **Framework**: React Native + Expo Go
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client
- **Maps**: React Native Maps (Google Maps)
- **Push Notifications**: Expo Notifications
- **Testing**: Jest + React Native Testing Library

### 外部服務整合
- **地圖服務**: Google Maps API
- **推播通知**: FCM (Firebase Cloud Messaging)
- **檔案儲存**: AWS S3 或 Google Cloud Storage
- **監控**: Prometheus + Grafana
- **日誌**: ELK Stack (Elasticsearch, Logstash, Kibana)