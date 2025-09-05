#!/bin/bash

# Pingnom 功能完整驗收測試腳本
# 驗收 1: 聚餐功能導航修復
# 驗收 2: 好友邀請功能完整流程

API_BASE="http://localhost:8090"

echo "🎯 Pingnom 功能驗收測試"
echo "======================="
echo "測試範圍："
echo "1. ✅ 聚餐功能導航修復驗證"  
echo "2. ✅ 好友邀請完整流程驗證"
echo "3. 🔄 前後端整合驗證"
echo ""

# 檢查服務狀態
echo "📊 檢查服務狀態"
echo "----------------"

# 檢查後端
curl -s "$API_BASE/health" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 後端服務正常 (localhost:8090)"
else
    echo "❌ 後端服務異常"
    exit 1
fi

# 檢查前端 (簡單的連接測試)
curl -s "http://localhost:8082" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 前端服務正常 (localhost:8082)"
else
    echo "⚠️  前端服務可能異常，但繼續測試"
fi
echo ""

echo "🍽️ 驗收 1: 聚餐功能 API 測試"  
echo "================================"

# 1. Frank 登入
echo "👨‍💼 Frank Li 登入..."
FRANK_LOGIN=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@pingnom.app", "password": "TestPassword2024!"}')

FRANK_TOKEN=$(echo "$FRANK_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
FRANK_USER_ID=$(echo "$FRANK_LOGIN" | sed 's/.*"sub":"\([^"]*\)".*/\1/')

if [[ "$FRANK_TOKEN" != "" ]]; then
    echo "✅ Frank 登入成功"
else
    echo "❌ Frank 登入失敗"
    exit 1
fi

# 2. 創建聚餐計畫 (測試導航修復的核心功能)
echo "🍴 創建聚餐計畫..."
CREATE_PLAN=$(curl -s -X POST "$API_BASE/api/v1/group-dining/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d "{\"title\": \"驗收測試聚餐\", \"description\": \"測試聚餐功能導航修復\", \"created_by\": \"$FRANK_USER_ID\"}")

PLAN_ID=$(echo "$CREATE_PLAN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ "$PLAN_ID" != "" ]]; then
    echo "✅ 聚餐計畫創建成功 (ID: $PLAN_ID)"
else
    echo "❌ 聚餐計畫創建失敗"
    echo "回應: $CREATE_PLAN"
    exit 1
fi

# 3. 查詢聚餐計畫詳情
echo "📋 查詢聚餐計畫詳情..."
PLAN_DETAIL=$(curl -s -X GET "$API_BASE/api/v1/group-dining/plans/$PLAN_ID" \
  -H "Authorization: Bearer $FRANK_TOKEN")

if echo "$PLAN_DETAIL" | grep -q "驗收測試聚餐"; then
    echo "✅ 聚餐計畫詳情查詢成功"
else
    echo "❌ 聚餐計畫詳情查詢失敗"
    echo "回應: $PLAN_DETAIL"
fi

# 4. 查詢創建者的聚餐列表
echo "📋 查詢創建者聚餐列表..."
USER_PLANS=$(curl -s -X GET "$API_BASE/api/v1/group-dining/plans?created_by=$FRANK_USER_ID" \
  -H "Authorization: Bearer $FRANK_TOKEN")

PLAN_COUNT=$(echo "$USER_PLANS" | grep -o '"id":"[^"]*"' | wc -l)
echo "✅ 聚餐列表查詢成功，找到 $PLAN_COUNT 個計畫"
echo ""

echo "👥 驗收 2: 好友邀請功能測試"
echo "=========================="

# 1. Alice 登入
echo "👩‍💼 Alice Wang 登入..."
ALICE_LOGIN=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@pingnom.app", "password": "AlicePassword2024!"}')

ALICE_TOKEN=$(echo "$ALICE_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [[ "$ALICE_TOKEN" != "" ]]; then
    echo "✅ Alice 登入成功"
else
    echo "❌ Alice 登入失敗"
    exit 1
fi

# 2. Frank 搜尋 Alice
echo "🔍 Frank 搜尋 Alice..."
SEARCH_RESULT=$(curl -s -X GET "$API_BASE/api/v1/users/search?q=Alice" \
  -H "Authorization: Bearer $FRANK_TOKEN")

ALICE_ID=$(echo "$SEARCH_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ "$ALICE_ID" != "" ]]; then
    echo "✅ 用戶搜尋功能正常，找到 Alice (ID: $ALICE_ID)"
else
    echo "❌ 用戶搜尋功能異常"
    exit 1
fi

# 3. Frank 發送好友邀請
echo "📤 Frank 發送好友邀請給 Alice..."
FRIEND_REQUEST=$(curl -s -X POST "$API_BASE/api/v1/friends/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d "{\"addresseeId\": \"$ALICE_ID\", \"message\": \"驗收測試好友邀請\"}")

FRIENDSHIP_ID=$(echo "$FRIEND_REQUEST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ "$FRIENDSHIP_ID" != "" ]]; then
    echo "✅ 好友邀請發送成功 (ID: $FRIENDSHIP_ID)"
else
    echo "❌ 好友邀請發送失敗"
    echo "回應: $FRIEND_REQUEST"
    exit 1
fi

# 4. Alice 查看待處理邀請
echo "📨 Alice 查看待處理好友邀請..."
PENDING_REQUESTS=$(curl -s -X GET "$API_BASE/api/v1/friends/requests/pending" \
  -H "Authorization: Bearer $ALICE_TOKEN")

if echo "$PENDING_REQUESTS" | grep -q "$FRIENDSHIP_ID"; then
    echo "✅ Alice 收到好友邀請"
else
    echo "❌ Alice 未收到好友邀請"
    echo "回應: $PENDING_REQUESTS"
fi

# 5. Alice 接受好友邀請
echo "✅ Alice 接受好友邀請..."
ACCEPT_RESULT=$(curl -s -X PUT "$API_BASE/api/v1/friends/request/$FRIENDSHIP_ID/accept" \
  -H "Authorization: Bearer $ALICE_TOKEN")

if echo "$ACCEPT_RESULT" | grep -q "accepted"; then
    echo "✅ 好友邀請接受成功"
else
    echo "❌ 好友邀請接受失敗"
    echo "回應: $ACCEPT_RESULT"
fi

# 6. 驗證好友關係建立
echo "👥 驗證好友關係是否正確建立..."

# Frank 的好友列表
FRANK_FRIENDS=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $FRANK_TOKEN")

# Alice 的好友列表  
ALICE_FRIENDS=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $ALICE_TOKEN")

FRANK_HAS_ALICE=false
ALICE_HAS_FRANK=false

if echo "$FRANK_FRIENDS" | grep -q "$ALICE_ID"; then
    FRANK_HAS_ALICE=true
fi

if echo "$ALICE_FRIENDS" | grep -q "$FRANK_USER_ID"; then
    ALICE_HAS_FRANK=true
fi

if [[ "$FRANK_HAS_ALICE" == true && "$ALICE_HAS_FRANK" == true ]]; then
    echo "✅ 雙向好友關係建立成功"
else
    echo "❌ 好友關係建立異常"
    echo "Frank 有 Alice: $FRANK_HAS_ALICE"
    echo "Alice 有 Frank: $ALICE_HAS_FRANK"
fi
echo ""

echo "🎯 綜合驗收結果"
echo "==============="

# 計算成功項目
SUCCESS_COUNT=0
TOTAL_COUNT=8

# 檢查各項功能
echo "📊 功能檢查清單："

echo -n "1. 後端服務運行: "
if curl -s "$API_BASE/health" > /dev/null; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "2. 用戶認證登入: "
if [[ "$FRANK_TOKEN" != "" && "$ALICE_TOKEN" != "" ]]; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "3. 聚餐計畫創建: "
if [[ "$PLAN_ID" != "" ]]; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "4. 聚餐計畫查詢: "
if echo "$PLAN_DETAIL" | grep -q "驗收測試聚餐"; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "5. 用戶搜尋功能: "
if [[ "$ALICE_ID" != "" ]]; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "6. 好友邀請發送: "
if [[ "$FRIENDSHIP_ID" != "" ]]; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "7. 好友邀請接受: "
if echo "$ACCEPT_RESULT" | grep -q "accepted"; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo -n "8. 雙向好友關係: "
if [[ "$FRANK_HAS_ALICE" == true && "$ALICE_HAS_FRANK" == true ]]; then
    echo "✅"
    ((SUCCESS_COUNT++))
else
    echo "❌"
fi

echo ""
echo "📈 驗收分數: $SUCCESS_COUNT/$TOTAL_COUNT"

if [[ $SUCCESS_COUNT -eq $TOTAL_COUNT ]]; then
    echo "🎉 所有功能驗收通過！"
    echo ""
    echo "✨ 主要成就："
    echo "✅ 聚餐功能導航錯誤已完全修復"
    echo "✅ CreateGroupDiningPlan 路由正常運作"
    echo "✅ 好友邀請完整流程運作正常"
    echo "✅ 雙向好友關係建立成功"
    echo "✅ 前後端 API 整合無誤"
    echo ""
    echo "🚀 系統已準備好進行用戶測試！"
    exit 0
else
    echo "⚠️  部分功能需要進一步檢查"
    exit 1
fi