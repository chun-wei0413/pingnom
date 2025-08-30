# 🏗️ Pingnom Domain-Driven Design

## 📍 Bounded Contexts

### 1. User Management Context (使用者管理領域)
**責任範圍**: 使用者身份驗證、個人檔案管理、隱私設定
- **Aggregates**: User
- **主要業務邏輯**: 註冊、登入、檔案更新、隱私控制

### 2. Social Context (社交關係領域)
**責任範圍**: 朋友關係、群組管理、社交互動
- **Aggregates**: Friendship, Group
- **主要業務邏輯**: 加友、建群、群組管理、社交圖譜

### 3. Ping Context (聚餐邀請領域)
**責任範圍**: 聚餐邀請的生命週期管理
- **Aggregates**: Ping
- **主要業務邏輯**: 發送邀請、回應邀請、狀態追蹤、取消邀請

### 4. Location Context (位置服務領域)
**責任範圍**: 位置追蹤、地理計算、最佳會面點分析
- **Aggregates**: UserLocation, MeetingPoint
- **主要業務邏輯**: 位置更新、距離計算、最佳路線規劃

### 5. Restaurant Context (餐廳服務領域)
**責任範圍**: 餐廳資訊、推薦算法、評分系統
- **Aggregates**: Restaurant, Recommendation
- **主要業務邏輯**: 餐廳搜尋、智慧推薦、評分計算

### 6. Communication Context (溝通協調領域)
**責任範圍**: 即時訊息、通知、狀態同步
- **Aggregates**: ChatSession, Notification
- **主要業務邏輯**: 即時聊天、推播通知、狀態廣播

### 7. Payment Context (支付分攤領域)
**責任範圍**: 帳單分攤、付款追蹤
- **Aggregates**: Bill, Payment
- **主要業務邏輯**: 費用分攤、付款提醒、記錄管理

---

## 🎯 Domain Models

### User Management Context

#### User (使用者) - Aggregate Root
```
User {
  + UserId: string
  + Email: string
  + PhoneNumber: string
  + Profile: UserProfile
  + Preferences: DietaryPreferences
  + PrivacySettings: PrivacySettings
  + CreatedAt: datetime
  + UpdatedAt: datetime
  
  + Register(email, phone)
  + UpdateProfile(profile)
  + SetPreferences(preferences)
  + UpdatePrivacySettings(settings)
}

UserProfile {
  + DisplayName: string
  + Avatar: string
  + Bio: string
  + DefaultLocations: Location[]
}

DietaryPreferences {
  + CuisineTypes: string[]
  + Restrictions: string[]
  + PriceRange: PriceRange
}
```

### Social Context

#### Friendship (朋友關係) - Aggregate Root
```
Friendship {
  + FriendshipId: string
  + RequesterUserId: string
  + AcceptorUserId: string
  + Status: FriendshipStatus
  + CreatedAt: datetime
  + AcceptedAt: datetime
  
  + SendRequest(requesterId, acceptorId)
  + Accept()
  + Reject()
  + Block()
}

Group (群組) - Aggregate Root {
  + GroupId: string
  + Name: string
  + Description: string
  + CreatorUserId: string
  + Members: GroupMember[]
  + GroupPreferences: DietaryPreferences
  + CreatedAt: datetime
  
  + CreateGroup(name, creatorId)
  + AddMember(userId)
  + RemoveMember(userId)
  + UpdatePreferences(preferences)
}
```

### Ping Context

#### Ping (聚餐邀請) - Aggregate Root
```
Ping {
  + PingId: string
  + InitiatorUserId: string
  + Title: string
  + Description: string
  + MealType: MealType
  + ProposedTime: datetime
  + Status: PingStatus
  + Participants: Participant[]
  + SelectedRestaurant: Restaurant?
  + CreatedAt: datetime
  
  + CreatePing(initiatorId, title, time)
  + InviteParticipants(userIds[])
  + RespondToInvitation(userId, response)
  + SelectRestaurant(restaurantId)
  + Cancel()
  + Complete()
}

Participant {
  + UserId: string
  + Response: InvitationResponse
  + RespondedAt: datetime
  + CurrentLocation: Location?
}
```

### Location Context

#### UserLocation (使用者位置) - Aggregate Root
```
UserLocation {
  + UserId: string
  + CurrentLocation: Location
  + LastUpdated: datetime
  + IsShared: boolean
  
  + UpdateLocation(location)
  + ShareLocation()
  + StopSharing()
}

MeetingPoint (會面點) - Aggregate Root {
  + PingId: string
  + OptimalLocation: Location
  + ParticipantDistances: Distance[]
  + TotalTravelTime: int
  + CalculatedAt: datetime
  
  + CalculateOptimalPoint(locations[])
  + RecalculateWhenParticipantChanges()
}
```

### Restaurant Context

#### Restaurant (餐廳) - Aggregate Root
```
Restaurant {
  + RestaurantId: string
  + Name: string
  + Location: Location
  + CuisineType: string
  + PriceRange: PriceRange
  + Rating: float
  + Photos: string[]
  + Contact: ContactInfo
  + OpeningHours: OpeningHours[]
  
  + UpdateInfo(info)
  + AddReview(userId, rating, comment)
  + GetAverageRating()
}

Recommendation (推薦) - Aggregate Root {
  + PingId: string
  + RecommendedRestaurants: RecommendedRestaurant[]
  + Algorithm: string
  + CreatedAt: datetime
  
  + GenerateRecommendations(ping, participants)
  + RankByRelevance()
  + FilterByPreferences(preferences)
}
```

---

## 🔄 Context Interactions

### 跨領域事件流
```
1. User creates Ping (Ping Context)
   → LocationUpdated Event (Location Context)
   → NotificationSent Event (Communication Context)

2. Participant responds to Ping (Ping Context)
   → ParticipantResponseUpdated Event
   → RecalculateMeetingPoint Event (Location Context)
   → RecommendationRequested Event (Restaurant Context)

3. Restaurant selected (Restaurant Context)
   → PingUpdated Event (Ping Context)
   → ChatSessionCreated Event (Communication Context)
```

### 共享實體
- **Location**: 在多個 Context 中共享的值物件
- **UserId**: 所有 Context 的統一識別符
- **PingId**: Ping, Location, Communication Context 間的關聯

---

## 📝 業務規則與不變量

### User Management Context
- 每個使用者的 Email/Phone 必須唯一
- 使用者必須完成基本檔案設定才能發送 Ping
- 隱私設定決定其他功能的可見性

### Social Context
- 朋友關係必須是雙向確認的
- 群組創建者有管理權限
- 群組成員上限：50人

### Ping Context
- 一個 Ping 最多邀請 20 人
- Ping 開始時間必須是未來時間
- 只有發起人可以取消 Ping
- 至少需要 2 人確認參加才能進行餐廳推薦

### Location Context
- 位置分享有時效性（24小時自動關閉）
- 最佳會面點計算需至少 2 個有效位置
- 位置精確度必須在合理範圍內

### Restaurant Context  
- 餐廳推薦最多顯示 10 家
- 推薦必須考慮所有參與者的飲食限制
- 評分更新會觸發推薦重新計算