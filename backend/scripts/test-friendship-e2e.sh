#!/bin/bash

# Pingnom 好友邀請功能 E2E 測試腳本
# 測試 Frank Li 邀請 Alice Wang 為好友的完整流程

API_BASE="http://localhost:8090"

echo "🧪 開始測試 Pingnom 好友邀請功能 E2E..."
echo "=================================="

# 檢查 API 服務是否運行
echo "📊 1. 檢查 API 服務狀態"
HEALTH_CHECK=$(curl -s "$API_BASE/health" -w "%{http_code}")
if [[ "$HEALTH_CHECK" != *"200" ]]; then
    echo "❌ API 服務未運行，請先啟動後端服務"
    exit 1
fi
echo "✅ API 服務正常運行"
echo ""

# Frank Li 登入
echo "👨‍💼 2. Frank Li 登入"
FRANK_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@pingnom.app",
    "password": "TestPassword2024!"
  }')

echo "Frank 登入回應: $FRANK_LOGIN_RESPONSE"

FRANK_TOKEN=$(echo "$FRANK_LOGIN_RESPONSE" | jq -r '.token // empty')
FRANK_USER_ID=$(echo "$FRANK_LOGIN_RESPONSE" | jq -r '.user.id // empty')

if [[ "$FRANK_TOKEN" == "null" || "$FRANK_TOKEN" == "" ]]; then
    echo "❌ Frank Li 登入失敗"
    echo "$FRANK_LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Frank Li 登入成功"
echo "Frank Token: ${FRANK_TOKEN:0:20}..."
echo "Frank User ID: $FRANK_USER_ID"
echo ""

# Alice Wang 登入
echo "👩‍💼 3. Alice Wang 登入"
ALICE_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@pingnom.app",
    "password": "AlicePassword2024!"
  }')

echo "Alice 登入回應: $ALICE_LOGIN_RESPONSE"

ALICE_TOKEN=$(echo "$ALICE_LOGIN_RESPONSE" | jq -r '.token // empty')
ALICE_USER_ID=$(echo "$ALICE_LOGIN_RESPONSE" | jq -r '.user.id // empty')

if [[ "$ALICE_TOKEN" == "null" || "$ALICE_TOKEN" == "" ]]; then
    echo "❌ Alice Wang 登入失敗"
    echo "$ALICE_LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Alice Wang 登入成功"
echo "Alice Token: ${ALICE_TOKEN:0:20}..."
echo "Alice User ID: $ALICE_USER_ID"
echo ""

# Frank 發送好友邀請給 Alice
echo "📤 4. Frank 發送好友邀請給 Alice"
FRIEND_REQUEST_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/friends/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d "{
    \"addresseeId\": \"$ALICE_USER_ID\",
    \"message\": \"Hi Alice, let's be friends!\"
  }")

echo "好友邀請回應: $FRIEND_REQUEST_RESPONSE"

FRIENDSHIP_ID=$(echo "$FRIEND_REQUEST_RESPONSE" | jq -r '.id // empty')
REQUEST_STATUS=$(echo "$FRIEND_REQUEST_RESPONSE" | jq -r '.status // empty')

if [[ "$FRIENDSHIP_ID" == "null" || "$FRIENDSHIP_ID" == "" ]]; then
    echo "❌ 好友邀請發送失敗"
    echo "$FRIEND_REQUEST_RESPONSE"
    exit 1
fi

echo "✅ 好友邀請發送成功"
echo "Friendship ID: $FRIENDSHIP_ID"
echo "初始狀態: $REQUEST_STATUS"
echo ""

# Alice 查看待處理的好友邀請
echo "📨 5. Alice 查看待處理的好友邀請"
PENDING_REQUESTS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/requests/pending" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Alice 的待處理邀請: $PENDING_REQUESTS_RESPONSE"

PENDING_COUNT=$(echo "$PENDING_REQUESTS_RESPONSE" | jq '. | length')
echo "待處理邀請數量: $PENDING_COUNT"
echo ""

# Alice 接受好友邀請
echo "✅ 6. Alice 接受好友邀請"
ACCEPT_RESPONSE=$(curl -s -X PUT "$API_BASE/api/v1/friends/request/$FRIENDSHIP_ID/accept" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "接受邀請回應: $ACCEPT_RESPONSE"

FINAL_STATUS=$(echo "$ACCEPT_RESPONSE" | jq -r '.status // empty')

if [[ "$FINAL_STATUS" != "accepted" ]]; then
    echo "❌ 好友邀請接受失敗"
    echo "$ACCEPT_RESPONSE"
    exit 1
fi

echo "✅ 好友邀請接受成功"
echo "最終狀態: $FINAL_STATUS"
echo ""

# Frank 查看好友列表
echo "👥 7. Frank 查看好友列表"
FRANK_FRIENDS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $FRANK_TOKEN")

echo "Frank 的好友列表: $FRANK_FRIENDS_RESPONSE"

FRANK_FRIENDS_COUNT=$(echo "$FRANK_FRIENDS_RESPONSE" | jq '. | length')
echo "Frank 的好友數量: $FRANK_FRIENDS_COUNT"

# 檢查 Alice 是否在 Frank 的好友列表中
ALICE_IN_FRANK_FRIENDS=$(echo "$FRANK_FRIENDS_RESPONSE" | jq --arg alice_id "$ALICE_USER_ID" '[.[] | select(.friend.id == $alice_id)] | length')
echo "Alice 是否在 Frank 好友列表中: $ALICE_IN_FRANK_FRIENDS"
echo ""

# Alice 查看好友列表
echo "👥 8. Alice 查看好友列表"
ALICE_FRIENDS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Alice 的好友列表: $ALICE_FRIENDS_RESPONSE"

ALICE_FRIENDS_COUNT=$(echo "$ALICE_FRIENDS_RESPONSE" | jq '. | length')
echo "Alice 的好友數量: $ALICE_FRIENDS_COUNT"

# 檢查 Frank 是否在 Alice 的好友列表中
FRANK_IN_ALICE_FRIENDS=$(echo "$ALICE_FRIENDS_RESPONSE" | jq --arg frank_id "$FRANK_USER_ID" '[.[] | select(.friend.id == $frank_id)] | length')
echo "Frank 是否在 Alice 好友列表中: $FRANK_IN_ALICE_FRIENDS"
echo ""

# 最終驗證
echo "🎯 9. 最終驗證結果"
echo "=================================="

SUCCESS=true

if [[ "$ALICE_IN_FRANK_FRIENDS" != "1" ]]; then
    echo "❌ 驗證失敗: Alice 不在 Frank 的好友列表中"
    SUCCESS=false
fi

if [[ "$FRANK_IN_ALICE_FRIENDS" != "1" ]]; then
    echo "❌ 驗證失敗: Frank 不在 Alice 的好友列表中"
    SUCCESS=false
fi

if [[ "$FINAL_STATUS" != "accepted" ]]; then
    echo "❌ 驗證失敗: 好友關係狀態不正確 ($FINAL_STATUS)"
    SUCCESS=false
fi

if [[ "$SUCCESS" == true ]]; then
    echo "🎉 E2E 測試完全成功!"
    echo "✅ Frank 成功邀請 Alice 為好友"
    echo "✅ Alice 成功接受邀請"
    echo "✅ 雙方好友列表都正確更新"
    echo "✅ 好友關係狀態為 accepted"
else
    echo "❌ E2E 測試失敗，請檢查上述錯誤"
    exit 1
fi

echo ""
echo "📊 測試總結:"
echo "- Friendship ID: $FRIENDSHIP_ID"
echo "- 最終狀態: $FINAL_STATUS"
echo "- Frank 好友數量: $FRANK_FRIENDS_COUNT"
echo "- Alice 好友數量: $ALICE_FRIENDS_COUNT"
echo "- 雙向關係驗證: ✅"