# 🧪 Pingnom 帳單分攤功能手動測試執行指南

## 📋 測試前準備

### 1. 服務啟動檢查
```bash
# 1. 啟動後端服務
cd backend
go run cmd/api/main_inmemory.go
# 確認看到: 🚀 Starting Pingnom API server on :8090

# 2. 啟動前端服務
cd frontend-mobile  
npm start
# 確認看到: Starting Metro Bundler, Waiting on http://localhost:8081

# 3. 健康檢查
curl http://localhost:8090/health
# 預期: {"service":"pingnom-api","status":"ok"}
```

### 2. 測試帳號驗證
```bash
# 登入 Frank Li
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@pingnom.app","password":"TestPassword2024!"}'
# 應該返回 JWT token

# 登入 Alice Wang  
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@pingnom.app","password":"AlicePassword2024!"}'
# 應該返回 JWT token
```

## 🎯 功能測試執行步驟

### 測試場景 1: 帳單建立與 API 驗證

#### Step 1: API 直接測試
```bash
# 取得 Frank 的 token (替換為實際返回的 token)
TOKEN="YOUR_FRANK_TOKEN_HERE"

# 建立測試帳單
curl -X POST http://localhost:8090/api/v1/bills/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Dinner Bill","description":"API Testing"}'

# 查看帳單列表
curl -H "Authorization: Bearer $TOKEN" http://localhost:8090/api/v1/bills/

# 取得特定帳單 (替換 BILL_ID)
BILL_ID="YOUR_BILL_ID_HERE"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8090/api/v1/bills/$BILL_ID
```

#### Step 2: 前端 UI 測試
1. **開啟前端應用**: 
   - 在瀏覽器前往 `http://localhost:8081`
   - 或使用 Expo 應用掃描 QR Code

2. **登入測試**:
   - ✅ 點擊「👨‍💼 Frank Li (創建者)」快速登入
   - ✅ 驗證成功進入主頁
   - ✅ 確認看到 Tab 導航: 首頁、聚餐、**帳單**、朋友、個人

3. **帳單功能導航**:
   - ✅ 點擊「帳單」Tab
   - ✅ 驗證顯示「帳單分攤」標題
   - ✅ 驗證顯示「+ 新增帳單」按鈕
   - ✅ 驗證顯示過濾器: 全部、我建立的、參與的

### 測試場景 2: 完整帳單流程

#### Step 1: 建立新帳單
```bash
# API 測試 - 建立帳單
curl -X POST http://localhost:8090/api/v1/bills/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d '{"title":"Friends Dinner","description":"Weekend dinner expenses"}'
```

**前端測試步驟**:
1. ✅ 點擊「+ 新增帳單」
2. ✅ 填寫標題: "Friends Dinner"  
3. ✅ 填寫描述: "Weekend dinner expenses"
4. ✅ 點擊「建立」按鈕
5. ✅ 驗證成功導航到帳單詳情頁面
6. ✅ 確認顯示帳單標題和描述
7. ✅ 確認狀態顯示為「草稿」

#### Step 2: 新增帳單項目
```bash
# API 測試 - 新增項目
curl -X POST http://localhost:8090/api/v1/bills/$BILL_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d '{
    "name": "Main Course",
    "amount": 600,
    "description": "Pasta and Steak",
    "splitters": ["'$FRANK_USER_ID'"]
  }'
```

**前端測試步驟**:
1. ✅ 在帳單詳情頁面點擊「+ 新增項目」
2. ✅ 填寫項目名稱: "Main Course"
3. ✅ 填寫金額: 600
4. ✅ 填寫描述: "Pasta and Steak"
5. ✅ 選擇分攤者: Frank Li
6. ✅ 點擊「新增」按鈕
7. ✅ 驗證項目出現在列表中
8. ✅ 驗證總金額更新

#### Step 3: 新增參與者
```bash
# 取得 Alice 的 User ID
ALICE_TOKEN="YOUR_ALICE_TOKEN_HERE" 
curl -H "Authorization: Bearer $ALICE_TOKEN" http://localhost:8090/api/v1/users/profile

# 新增 Alice 為參與者
curl -X POST http://localhost:8090/api/v1/bills/$BILL_ID/participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d '{
    "userId": "'$ALICE_USER_ID'",
    "displayName": "Alice Wang"
  }'
```

**前端測試步驟**:
1. ✅ 點擊「+ 新增參與者」
2. ✅ 輸入 Alice 的資訊
3. ✅ 點擊「新增」按鈕  
4. ✅ 驗證 Alice 出現在參與者列表
5. ✅ 驗證參與者統計數量更新

#### Step 4: 付款狀態管理
```bash
# Frank 標記已付款
curl -X PUT http://localhost:8090/api/v1/bills/$BILL_ID/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d '{"amount": 300}'

# Alice 標記已付款  
curl -X PUT http://localhost:8090/api/v1/bills/$BILL_ID/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"amount": 300}'
```

**前端測試步驟**:
1. ✅ Frank 點擊自己的「標記已付」按鈕
2. ✅ 確認付款對話框
3. ✅ 驗證 Frank 狀態變更為「已付清」
4. ✅ 開啟新分頁，登入 Alice
5. ✅ Alice 進入相同帳單
6. ✅ Alice 點擊「標記已付」
7. ✅ 驗證 Alice 狀態更新
8. ✅ 驗證帳單整體狀態變更

### 測試場景 3: 過濾器與列表功能

#### API 測試
```bash
# 測試不同過濾器
curl -H "Authorization: Bearer $FRANK_TOKEN" "http://localhost:8090/api/v1/bills/?filter=all"
curl -H "Authorization: Bearer $FRANK_TOKEN" "http://localhost:8090/api/v1/bills/?filter=created"  
curl -H "Authorization: Bearer $ALICE_TOKEN" "http://localhost:8090/api/v1/bills/?filter=participant"
```

**前端測試步驟**:
1. ✅ 在帳單列表點擊「全部」過濾器
2. ✅ 記錄顯示的帳單數量
3. ✅ 點擊「我建立的」過濾器
4. ✅ 驗證只顯示 Frank 建立的帳單
5. ✅ 點擊「參與的」過濾器
6. ✅ 驗證過濾邏輯正確

## ✅ 驗收標準檢查

### A. API 功能完整性
```bash
# 檢查所有帳單 API 端點
echo "測試帳單 API 端點..."

# 1. 建立帳單
curl -X POST http://localhost:8090/api/v1/bills/ -H "Authorization: Bearer $TOKEN" -d '{"title":"API Test"}'

# 2. 取得帳單列表
curl -H "Authorization: Bearer $TOKEN" http://localhost:8090/api/v1/bills/

# 3. 取得特定帳單
curl -H "Authorization: Bearer $TOKEN" http://localhost:8090/api/v1/bills/$BILL_ID

# 4. 新增項目
curl -X POST http://localhost:8090/api/v1/bills/$BILL_ID/items -H "Authorization: Bearer $TOKEN" -d '{...}'

# 5. 新增參與者
curl -X POST http://localhost:8090/api/v1/bills/$BILL_ID/participants -H "Authorization: Bearer $TOKEN" -d '{...}'

# 6. 標記付款
curl -X PUT http://localhost:8090/api/v1/bills/$BILL_ID/payments -H "Authorization: Bearer $TOKEN" -d '{...}'
```

### B. 前端功能完整性
- [ ] ✅ 帳單列表正確載入和顯示
- [ ] ✅ 建立帳單功能完全正常
- [ ] ✅ 帳單詳情頁面所有功能運作
- [ ] ✅ 新增項目和參與者功能正常
- [ ] ✅ 付款狀態管理正確運作
- [ ] ✅ 過濾器功能正常運作
- [ ] ✅ 導航流程順暢無錯誤

### C. 資料同步驗證
- [ ] ✅ 前後端資料完全同步
- [ ] ✅ 即時更新正確顯示
- [ ] ✅ 多用戶互動正常運作
- [ ] ✅ 帳單狀態變化正確追蹤

## 🐛 常見問題排除

### 1. 前端無法連接後端
```bash
# 檢查後端是否運行
curl http://localhost:8090/health

# 檢查前端環境變數
cat frontend-mobile/.env
```

### 2. 登入失敗
```bash
# 重新創建測試帳號
cd backend
go run cmd/api/main_inmemory.go
# 重啟會自動創建 Frank 和 Alice 帳號
```

### 3. API 回應 401 錯誤
```bash
# 重新取得有效 token
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@pingnom.app","password":"TestPassword2024!"}'
```

## 📊 測試報告模板

### 執行日期: ___________
### 執行人員: ___________

**功能測試結果**:
- [ ] 場景 1: 帳單建立與 API 驗證
- [ ] 場景 2: 完整帳單流程  
- [ ] 場景 3: 過濾器與列表功能

**發現問題**:
1. _________________________________
2. _________________________________
3. _________________________________

**整體評估**: □ 通過 / □ 需要修復

**備註**:
_____________________________________
_____________________________________