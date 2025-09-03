# 群組聚餐規劃 API 規格書

## API 基礎資訊

- **基礎 URL**: `http://localhost:8090/api/v1/group-dining`
- **認證方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 資料模型

### GroupDiningPlan (群組聚餐計劃)
```json
{
  "id": "string",
  "created_by": "string",
  "title": "string",
  "description": "string",
  "status": "created|voting|confirmed|cancelled",
  "time_slots": [TimeSlot],
  "restaurant_options": [RestaurantOption],
  "participants": [Participant],
  "confirmed_time_slot": TimeSlot,
  "confirmed_restaurant": RestaurantOption,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "voting_deadline": "2024-12-03T18:00:00Z"
}
```

### TimeSlot (時間選項)
```json
{
  "id": "string",
  "start_time": "2024-12-14T18:00:00Z",
  "end_time": "2024-12-14T20:00:00Z",
  "description": "週五晚餐時間",
  "vote_count": 0
}
```

### RestaurantOption (餐廳選項)
```json
{
  "id": "string",
  "name": "鼎泰豐 (信義店)",
  "address": "台北市信義區松仁路58號",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "cuisine_type": "中式料理",
  "vote_count": 0
}
```

### Vote (投票)
```json
{
  "id": "string",
  "plan_id": "string",
  "user_id": "string",
  "choices": [
    {
      "id": "string",
      "type": "time|restaurant",
      "option_id": "string"
    }
  ],
  "comment": "期待這次聚餐！",
  "voted_at": "2024-12-01T12:00:00Z"
}
```

## API 端點

### 1. 創建群組聚餐計劃

**POST** `/plans`

```json
// Request
{
  "created_by": "user_123",
  "title": "週末聚餐計劃",
  "description": "來一起享受美好的週末聚餐時光吧！"
}

// Response (201 Created)
{
  "id": "plan_456",
  "created_by": "user_123",
  "title": "週末聚餐計劃",
  "description": "來一起享受美好的週末聚餐時光吧！",
  "status": "created",
  "time_slots": [],
  "restaurant_options": [],
  "participants": [
    {
      "user_id": "user_123",
      "display_name": "創建者",
      "joined_at": "2024-12-01T10:00:00Z",
      "has_voted": false
    }
  ],
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### 2. 取得聚餐計劃詳情

**GET** `/plans/{planId}`

```json
// Response (200 OK)
{
  "id": "plan_456",
  "created_by": "user_123",
  "title": "週末聚餐計劃",
  "status": "voting",
  "time_slots": [...],
  "restaurant_options": [...],
  "participants": [...],
  "voting_deadline": "2024-12-03T18:00:00Z",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

### 3. 取得使用者創建的計劃

**GET** `/plans?created_by={userId}`

```json
// Response (200 OK)
{
  "plans": [
    {
      "id": "plan_456",
      "title": "週末聚餐計劃",
      "status": "voting",
      "participants": [...],
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### 4. 取得參與的聚餐計劃

**GET** `/participants/plans?user_id={userId}`

```json
// Response (200 OK)
{
  "plans": [
    {
      "id": "plan_789",
      "title": "公司聚餐",
      "created_by": "user_456",
      "status": "confirmed",
      "confirmed_time_slot": {...},
      "confirmed_restaurant": {...}
    }
  ]
}
```

### 5. 新增時間選項

**POST** `/plans/{planId}/time-slots`

```json
// Request
{
  "start_time": "2024-12-14T18:00:00Z",
  "end_time": "2024-12-14T20:00:00Z",
  "description": "週五晚餐時間"
}

// Response (200 OK)
{
  // 更新後的完整 GroupDiningPlan
}
```

### 6. 新增餐廳選項

**POST** `/plans/{planId}/restaurants`

```json
// Request
{
  "name": "鼎泰豐 (信義店)",
  "address": "台北市信義區松仁路58號",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "cuisine_type": "中式料理"
}

// Response (200 OK)
{
  // 更新後的完整 GroupDiningPlan
}
```

### 7. 加入聚餐計劃

**POST** `/plans/{planId}/join`

```json
// Request
{
  "user_id": "user_789",
  "display_name": "Alice Wang"
}

// Response (200 OK)
{
  // 更新後的完整 GroupDiningPlan，包含新參與者
}
```

### 8. 開始投票

**POST** `/plans/{planId}/start-voting`

```json
// Request
{
  "voting_deadline": "2024-12-03T18:00:00Z" // 可選
}

// Response (200 OK)
{
  // 狀態更新為 "voting" 的完整 GroupDiningPlan
}
```

### 9. 提交投票

**POST** `/plans/{planId}/vote`

```json
// Request
{
  "user_id": "user_789",
  "time_slot_ids": ["timeslot_1", "timeslot_2"],
  "restaurant_ids": ["restaurant_1"],
  "comment": "期待這次聚餐！"
}

// Response (200 OK)
{
  "id": "vote_123",
  "plan_id": "plan_456",
  "user_id": "user_789",
  "choices": [
    {
      "id": "choice_1",
      "type": "time",
      "option_id": "timeslot_1"
    },
    {
      "id": "choice_2", 
      "type": "time",
      "option_id": "timeslot_2"
    },
    {
      "id": "choice_3",
      "type": "restaurant",
      "option_id": "restaurant_1"
    }
  ],
  "comment": "期待這次聚餐！",
  "voted_at": "2024-12-01T12:00:00Z"
}
```

### 10. 查看投票結果

**GET** `/plans/{planId}/results`

```json
// Response (200 OK)
{
  "total_participants": 5,
  "voted_participants": 3,
  "voting_progress": 60.0,
  "time_slots": [
    {
      "id": "timeslot_1",
      "start_time": "2024-12-14T18:00:00Z",
      "end_time": "2024-12-14T20:00:00Z",
      "description": "週五晚餐時間",
      "vote_count": 2
    }
  ],
  "restaurants": [
    {
      "id": "restaurant_1",
      "name": "鼎泰豐 (信義店)",
      "address": "台北市信義區松仁路58號",
      "vote_count": 3
    }
  ]
}
```

### 11. 確認最終安排

**POST** `/plans/{planId}/finalize`

```json
// Request
{
  "time_slot_id": "timeslot_1",
  "restaurant_id": "restaurant_1"
}

// Response (200 OK)
{
  // 狀態更新為 "confirmed" 的完整 GroupDiningPlan
  // 包含 confirmed_time_slot 和 confirmed_restaurant
}
```

## 錯誤回應

### 標準錯誤格式
```json
{
  "error": "錯誤描述",
  "code": "ERROR_CODE",
  "details": "詳細錯誤資訊"
}
```

### 常見錯誤碼

| HTTP狀態碼 | 錯誤碼 | 描述 |
|-----------|--------|------|
| 400 | `INVALID_REQUEST` | 請求參數無效 |
| 401 | `UNAUTHORIZED` | 未授權的請求 |
| 403 | `FORBIDDEN` | 無權限執行此操作 |
| 404 | `PLAN_NOT_FOUND` | 聚餐計劃不存在 |
| 409 | `INVALID_STATUS` | 計劃狀態不允許此操作 |
| 409 | `ALREADY_VOTED` | 已經投過票 |
| 409 | `ALREADY_PARTICIPANT` | 已經是參與者 |

### 錯誤範例

```json
// 400 Bad Request
{
  "error": "plan ID cannot be empty",
  "code": "INVALID_REQUEST"
}

// 404 Not Found
{
  "error": "group dining plan not found",
  "code": "PLAN_NOT_FOUND"
}

// 409 Conflict
{
  "error": "cannot add time slots after plan is finalized",
  "code": "INVALID_STATUS"
}
```

## 業務規則

### 狀態轉換規則

1. **created → voting**
   - 需要至少 2 個參與者
   - 需要至少 1 個時間選項
   - 需要至少 1 個餐廳選項
   - 只有創建者可以執行

2. **voting → confirmed**
   - 只有創建者可以執行
   - 需要選擇具體的時間選項和餐廳選項

3. **任何狀態 → cancelled**
   - 只有創建者可以執行
   - 已確認的計劃不能取消

### 投票規則

1. 只有參與者可以投票
2. 每個參與者只能投票一次
3. 必須同時選擇至少一個時間選項和一個餐廳選項
4. 支援多選投票

### 權限控制

1. **創建者權限**：
   - 新增時間和餐廳選項
   - 開始投票
   - 確認最終安排
   - 取消計劃

2. **參與者權限**：
   - 查看計劃詳情
   - 提交投票
   - 查看投票結果

3. **公開權限**：
   - 加入計劃（如果開放）
   - 查看基本資訊

## 效能考量

### 推薦的使用方式

1. **批量操作**：新增多個選項時建議使用批量 API
2. **快取策略**：投票結果可以快取，減少計算負載
3. **分頁查詢**：對於大量計劃的查詢應實施分頁
4. **即時更新**：考慮使用 WebSocket 或 SSE 提供即時投票更新

### 限制

1. **參與者上限**：建議單一計劃不超過 100 人
2. **選項數量**：時間選項和餐廳選項各不超過 20 個
3. **請求頻率**：每用戶每分鐘不超過 60 次請求

## 未來擴展

### 計劃中的功能

1. **邀請系統**：支援邀請連結和 QR Code
2. **通知系統**：投票提醒、結果通知等
3. **重複計劃**：支援週期性聚餐計劃
4. **餐廳整合**：與現有餐廳系統深度整合
5. **投票分析**：提供更詳細的投票統計和分析