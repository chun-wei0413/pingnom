# Pingnom 前端功能場景測試驗收

## 🎯 測試目標
驗證前端所有功能與後端 API 的對應完整性，確保用戶在前端能夠完整使用後端提供的所有功能。

## 📱 測試環境
- **前端**: http://localhost:8082 (React Native + Expo)
- **後端**: http://localhost:8090 (Golang API)
- **測試帳號**: 
  - Frank Li (testuser@pingnom.app / TestPassword2024!)
  - Alice Wang (alice@pingnom.app / AlicePassword2024!)

## 🧪 測試場景規劃

### 場景 1: 用戶認證與個人檔案管理
**對應後端 API**:
- POST `/api/v1/auth/login` ✅
- GET `/api/v1/users/profile`
- PUT `/api/v1/users/profile`
- PUT `/api/v1/users/password`
- PUT `/api/v1/users/preferences`
- PUT `/api/v1/users/privacy`

**前端測試步驟**:
1. 啟動前端應用 (localhost:8082)
2. 測試登入功能 - 使用 Frank Li 帳號
3. 檢查個人資料顯示
4. 測試個人資料編輯功能
5. 測試密碼變更功能
6. 測試偏好設定功能
7. 測試隱私設定功能
8. 登出並重新登入驗證

### 場景 2: 好友系統完整流程
**對應後端 API**:
- GET `/api/v1/users/search` ✅
- POST `/api/v1/friends/request` ✅
- GET `/api/v1/friends/requests/pending` ✅
- PUT `/api/v1/friends/request/:id/accept` ✅
- PUT `/api/v1/friends/request/:id/decline`
- GET `/api/v1/friends/` ✅
- GET `/api/v1/friends/requests/sent`
- POST `/api/v1/friends/block`
- DELETE `/api/v1/friends/:friendId`

**前端測試步驟**:
1. Frank Li 搜尋 Alice Wang
2. 發送好友邀請給 Alice
3. 登出 Frank，登入 Alice
4. Alice 查看待處理好友邀請
5. Alice 接受 Frank 的好友邀請
6. 驗證 Alice 的好友列表包含 Frank
7. 登入 Frank，驗證好友列表包含 Alice
8. 測試好友管理功能（移除、封鎖等）

### 場景 3: Ping 系統功能測試
**對應後端 API**:
- POST `/api/v1/pings/`
- GET `/api/v1/pings/`
- PUT `/api/v1/pings/:id/respond`

**前端測試步驟**:
1. Frank 創建新的 Ping 邀請
2. 選擇邀請對象 (Alice)
3. 設定聚餐時間和地點偏好
4. 發送 Ping 邀請
5. 登入 Alice，查看收到的 Ping
6. Alice 回應 Ping 邀請
7. Frank 查看 Ping 回應結果

### 場景 4: 餐廳搜尋與推薦系統
**對應後端 API**:
- GET `/api/v1/restaurants/`
- POST `/api/v1/restaurants/recommendations`
- GET `/api/v1/restaurants/:id`

**前端測試步驟**:
1. 使用餐廳搜尋功能
2. 測試依地區搜尋餐廳
3. 測試餐廳推薦功能
4. 查看餐廳詳情頁面
5. 測試餐廳收藏功能
6. 驗證推薦算法是否正常運作

### 場景 5: 聚餐規劃完整流程 (主要功能)
**對應後端 API**:
- POST `/api/v1/group-dining/plans` ✅
- GET `/api/v1/group-dining/plans/:id` ✅
- GET `/api/v1/group-dining/plans` ✅
- GET `/api/v1/group-dining/participants/plans`
- POST `/api/v1/group-dining/plans/:id/time-slots`
- POST `/api/v1/group-dining/plans/:id/restaurants`
- POST `/api/v1/group-dining/plans/:id/join`
- POST `/api/v1/group-dining/plans/:id/start-voting`
- POST `/api/v1/group-dining/plans/:id/vote`
- GET `/api/v1/group-dining/plans/:id/results`
- POST `/api/v1/group-dining/plans/:id/finalize`

**前端測試步驟**:
1. **創建聚餐計畫**
   - 導航到聚餐頁面
   - 點擊「建立聚餐計畫」按鈕（測試導航修復）
   - 填寫聚餐標題和描述
   - 提交創建聚餐計畫

2. **管理聚餐選項**
   - 進入聚餐計畫詳情頁面
   - 新增時間選項
   - 新增餐廳選項
   - 邀請朋友參加聚餐

3. **參與聚餐流程**
   - 登入 Alice，查看聚餐邀請
   - Alice 加入聚餐計畫
   - 查看參與者列表

4. **投票與決定**
   - Frank 啟動投票階段
   - Alice 進行投票選擇
   - 查看投票結果
   - Frank 確認最終決定

5. **聚餐狀態追蹤**
   - 驗證聚餐狀態變化 (planning → voting → finalized)
   - 測試不同狀態下的功能可用性

## ✅ 驗收標準

### A. 功能完整性
- [ ] 所有後端 API 端點都有對應前端功能
- [ ] 前端能正確調用所有後端 API
- [ ] API 回應數據能正確顯示在前端

### B. 用戶體驗
- [ ] 導航流程順暢，無錯誤
- [ ] 載入狀態正確顯示
- [ ] 錯誤處理機制正常
- [ ] 資料同步及時準確

### C. 功能邏輯
- [ ] 認證機制正常運作
- [ ] 權限控制正確執行
- [ ] 資料驗證完整有效
- [ ] 業務流程邏輯正確

### D. 整合穩定性
- [ ] 前後端資料格式一致
- [ ] API 調用無錯誤
- [ ] 狀態管理正確同步
- [ ] 錯誤恢復機制有效

## 🚨 已知問題與修復驗證

### 修復項目 1: 聚餐功能導航錯誤
- **問題**: `CreateGroupDiningPlan` 導航錯誤
- **修復**: 重構導航架構，新增 GroupDiningStackNavigator
- **驗收**: 確認聚餐計畫創建流程完全正常

### 修復項目 2: 好友邀請功能
- **問題**: 好友邀請流程不完整  
- **修復**: 後端 API 已通過 E2E 測試
- **驗收**: 確認前端好友功能與後端完全對應

## 📊 測試執行記錄

每個場景執行後請記錄：

**場景 X 執行結果:**
- 測試日期: 
- 執行人員:
- 測試結果: ✅ 通過 / ❌ 失敗
- 發現問題:
- 改進建議:

---

## 🔧 測試執行指南

### 準備工作
1. 確保後端服務運行 (localhost:8090)
2. 確保前端服務運行 (localhost:8082) 
3. 準備測試用戶帳號
4. 清空瀏覽器快取

### 執行方式
1. 按場景順序執行
2. 每個場景完整執行所有步驟
3. 記錄異常情況和錯誤訊息
4. 驗證前後端資料一致性

### 驗收準則
- 所有場景必須 100% 通過
- 無關鍵性錯誤或功能缺失
- 用戶體驗流暢完整
- 前後端功能完全對應