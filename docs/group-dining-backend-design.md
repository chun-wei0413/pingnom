# 群組聚餐規劃系統 - 後端設計文檔

## 📋 系統概述

群組聚餐規劃系統是一個基於 DDD (Domain-Driven Design) 和 Clean Architecture 的後端服務，旨在幫助用戶創建、管理和協調群組聚餐活動。

## 🏗️ 架構設計

### Domain Layer (領域層)

#### 核心聚合 (Aggregates)

##### 1. GroupDiningPlan (群組聚餐計劃) - 聚合根
```go
type GroupDiningPlan struct {
    ID                string              `json:"id"`
    CreatedBy         string              `json:"created_by"`
    Title             string              `json:"title"`
    Description       string              `json:"description"`
    Status            PlanStatus          `json:"status"`
    TimeSlots         []TimeSlot          `json:"time_slots"`
    RestaurantOptions []RestaurantOption  `json:"restaurant_options"`
    Participants      []Participant       `json:"participants"`
    ConfirmedTimeSlot *TimeSlot          `json:"confirmed_time_slot,omitempty"`
    ConfirmedRestaurant *RestaurantOption `json:"confirmed_restaurant,omitempty"`
    CreatedAt         time.Time           `json:"created_at"`
    UpdatedAt         time.Time           `json:"updated_at"`
    VotingDeadline    *time.Time         `json:"voting_deadline,omitempty"`
}
```

**業務規則：**
- 創建者自動成為第一個參與者
- 只能在 `created` 狀態下新增時間和餐廳選項
- 開始投票需要至少 2 個參與者、1 個時間選項和 1 個餐廳選項
- 只有創建者可以開始投票和確認最終安排

**狀態轉換：**
```
created → voting → confirmed
   ↓         ↓
cancelled ← cancelled
```

##### 2. Vote (投票) - 聚合根
```go
type Vote struct {
    ID       string       `json:"id"`
    PlanID   string       `json:"plan_id"`
    UserID   string       `json:"user_id"`
    Choices  []VoteChoice `json:"choices"`
    Comment  string       `json:"comment,omitempty"`
    VotedAt  time.Time    `json:"voted_at"`
}
```

**業務規則：**
- 每個參與者只能對一個計劃投票一次
- 必須同時選擇至少一個時間選項和一個餐廳選項
- 支援多選投票（一個用戶可以選擇多個時間/餐廳）

#### 值對象 (Value Objects)

##### TimeSlot (時間選項)
```go
type TimeSlot struct {
    ID          string    `json:"id"`
    StartTime   time.Time `json:"start_time"`
    EndTime     time.Time `json:"end_time"`
    Description string    `json:"description"`
    VoteCount   int       `json:"vote_count"`
}
```

##### RestaurantOption (餐廳選項)
```go
type RestaurantOption struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Address     string  `json:"address"`
    Latitude    float64 `json:"latitude"`
    Longitude   float64 `json:"longitude"`
    CuisineType string  `json:"cuisine_type"`
    VoteCount   int     `json:"vote_count"`
}
```

##### Participant (參與者)
```go
type Participant struct {
    UserID      string    `json:"user_id"`
    DisplayName string    `json:"display_name"`
    JoinedAt    time.Time `json:"joined_at"`
    HasVoted    bool      `json:"has_voted"`
}
```

### Application Layer (應用層)

#### Use Cases (用例)

1. **CreateGroupDiningPlanUseCase** - 創建群組聚餐計劃
2. **AddTimeSlotUseCase** - 新增時間選項
3. **AddRestaurantOptionUseCase** - 新增餐廳選項
4. **JoinGroupDiningPlanUseCase** - 加入聚餐計劃
5. **StartVotingUseCase** - 開始投票流程
6. **SubmitVoteUseCase** - 提交投票
7. **FinalizeGroupDiningPlanUseCase** - 確認最終安排
8. **GetGroupDiningPlanUseCase** - 查詢聚餐計劃
9. **GetVotingResultsUseCase** - 獲取投票結果

#### DTOs (資料傳輸物件)

請求 DTOs：
- `CreateGroupDiningPlanRequest`
- `AddTimeSlotRequest`
- `AddRestaurantOptionRequest`
- `SubmitVoteRequest`
- 等...

回應 DTOs：
- `GroupDiningPlanResponse`
- `VoteResponse`
- `VotingResultsResponse`
- 等...

### Infrastructure Layer (基礎設施層)

#### Repositories (資料倉庫)

目前實作：
- `GroupDiningPlanRepositoryInMemory` - 記憶體版本
- `VoteRepositoryInMemory` - 記憶體版本

未來可擴展：
- PostgreSQL 版本
- Redis 快取層

### Interface Layer (介面層)

#### REST API 端點

| HTTP方法 | 端點 | 功能描述 |
|---------|------|----------|
| `POST` | `/api/v1/group-dining/plans` | 創建群組聚餐計劃 |
| `GET` | `/api/v1/group-dining/plans/:id` | 取得特定計劃詳情 |
| `GET` | `/api/v1/group-dining/plans` | 取得使用者創建的計劃 |
| `GET` | `/api/v1/group-dining/participants/plans` | 取得參與的計劃 |
| `POST` | `/api/v1/group-dining/plans/:id/time-slots` | 新增時間選項 |
| `POST` | `/api/v1/group-dining/plans/:id/restaurants` | 新增餐廳選項 |
| `POST` | `/api/v1/group-dining/plans/:id/join` | 加入聚餐計劃 |
| `POST` | `/api/v1/group-dining/plans/:id/start-voting` | 開始投票程序 |
| `POST` | `/api/v1/group-dining/plans/:id/vote` | 提交投票 |
| `GET` | `/api/v1/group-dining/plans/:id/results` | 查看投票結果 |
| `POST` | `/api/v1/group-dining/plans/:id/finalize` | 確認最終安排 |

## 🤔 設計考量與討論點

### 1. 業務邏輯設計

#### 投票規則
- **現況**：每個參與者只能投票一次，支援多選
- **討論點**：是否允許修改已提交的投票？
- **建議**：考慮加入投票修改功能，但有時間限制

#### 確認權限
- **現況**：只有創建者可以確認最終安排
- **討論點**：是否需要更民主的決策機制？
- **可能方案**：
  - 維持創建者決定
  - 投票達到一定比例自動確認
  - 多數決機制

### 2. 資料模型設計

#### 時間選項設計
```go
// 目前設計
type TimeSlot struct {
    ID          string    `json:"id"`
    StartTime   time.Time `json:"start_time"`
    EndTime     time.Time `json:"end_time"`
    Description string    `json:"description"`
    VoteCount   int       `json:"vote_count"`
}

// 可能的擴展
type TimeSlot struct {
    // ... 現有欄位
    IsRecurring bool              `json:"is_recurring,omitempty"`
    RecurrenceRule *RecurrenceRule `json:"recurrence_rule,omitempty"`
    TimeZone    string            `json:"timezone"`
}
```

#### 餐廳選項整合
- **現況**：獨立的 RestaurantOption 結構
- **討論點**：是否與現有 Restaurant 系統整合？
- **可能方案**：
  - 保持獨立，允許臨時餐廳選項
  - 整合現有系統，引用 RestaurantID
  - 混合模式，支援兩種類型

### 3. 技術架構設計

#### 即時更新需求
- **現況**：REST API 輪詢機制
- **討論點**：是否需要即時推送投票更新？
- **可能方案**：
  - WebSocket 連接
  - Server-Sent Events (SSE)
  - 短輪詢機制

#### 效能考量
```go
// 目前的投票計數機制
func (p *GroupDiningPlan) RecordVote(userID string, timeSlotIDs, restaurantIDs []string) error {
    // 直接在記憶體中更新計數
    // 可能的效能問題：大量參與者時的併發更新
}

// 可能的優化方案
type VotingResults struct {
    TimeSlotVotes    map[string]int `json:"time_slot_votes"`
    RestaurantVotes  map[string]int `json:"restaurant_votes"`
    LastUpdated      time.Time      `json:"last_updated"`
}
```

### 4. 整合設計

#### 與 Ping 系統的關係
- **現況**：獨立系統
- **討論點**：群組聚餐是否應該作為 Ping 的擴展？
- **可能方案**：
  - 獨立系統，通過 API 整合
  - 作為 Ping 的子功能
  - 創建 Ping 時可選擇類型（簡單/群組）

#### 邀請機制
- **現況**：手動加入參與者
- **討論點**：如何實現邀請功能？
- **可能方案**：
  - 邀請連結
  - 朋友列表邀請
  - QR Code 邀請

## 📝 下一步行動項目

1. **確認業務規則**：投票修改、確認權限等
2. **設計邀請系統**：如何邀請參與者
3. **效能優化**：大量參與者的處理機制
4. **系統整合**：與現有 Ping/朋友系統的整合方式
5. **資料持久化**：從 InMemory 遷移到 PostgreSQL

## 🔍 需要討論的問題

請對以下問題提供意見：

1. **投票規則**：是否允許修改已提交的投票？
2. **確認機制**：維持創建者決定還是改為更民主的機制？
3. **時間選項**：是否需要支援重複時間（如每週固定）？
4. **餐廳整合**：與現有 Restaurant 系統的整合程度？
5. **邀請機制**：偏好哪種邀請方式？
6. **即時更新**：是否需要 WebSocket 等即時推送？
7. **系統定位**：群組聚餐與 Ping 系統的關係？