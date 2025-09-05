#!/bin/bash

# Pingnom 好友邀請功能 E2E 測試腳本 (簡化版，不依賴 jq)
# 測試 Frank Li 邀請 Alice Wang 為好友的完整流程

API_BASE="http://localhost:8090"

echo "🧪 開始測試 Pingnom 好友邀請功能 E2E (簡化版)..."
echo "====================================================="

# 檢查 API 服務是否運行
echo "📊 1. 檢查 API 服務狀態"
curl -s "$API_BASE/health" > /dev/null
if [ $? -ne 0 ]; then
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

# 手動提取 token (簡單的字符串操作)
FRANK_TOKEN=$(echo "$FRANK_LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
FRANK_USER_ID=$(echo "$FRANK_LOGIN_RESPONSE" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)

if [[ "$FRANK_TOKEN" == "" ]]; then
    # 嘗試另一種提取方式
    FRANK_TOKEN=$(echo "$FRANK_LOGIN_RESPONSE" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
    FRANK_USER_ID=$(echo "$FRANK_LOGIN_RESPONSE" | sed 's/.*"sub":"\([^"]*\)".*/\1/')
fi

echo "Frank Token: ${FRANK_TOKEN:0:50}..."
echo "Frank User ID: $FRANK_USER_ID"

if [[ "$FRANK_TOKEN" == "" ]]; then
    echo "❌ Frank Li 登入失敗 - 無法提取 token"
    exit 1
fi

echo "✅ Frank Li 登入成功"
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

# 手動提取 token
ALICE_TOKEN=$(echo "$ALICE_LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
ALICE_USER_ID=$(echo "$ALICE_LOGIN_RESPONSE" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)

if [[ "$ALICE_TOKEN" == "" ]]; then
    # 嘗試另一種提取方式
    ALICE_TOKEN=$(echo "$ALICE_LOGIN_RESPONSE" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
    ALICE_USER_ID=$(echo "$ALICE_LOGIN_RESPONSE" | sed 's/.*"sub":"\([^"]*\)".*/\1/')
fi

echo "Alice Token: ${ALICE_TOKEN:0:50}..."
echo "Alice User ID: $ALICE_USER_ID"

if [[ "$ALICE_TOKEN" == "" ]]; then
    echo "❌ Alice Wang 登入失敗 - 無法提取 token"
    exit 1
fi

echo "✅ Alice Wang 登入成功"
echo ""

# 如果沒有 User ID，嘗試從 JWT token 解碼 (base64)
if [[ "$ALICE_USER_ID" == "" ]]; then
    # JWT token 的 payload 是 base64 編碼的，但需要 jq 來解析
    # 我們先用硬編碼的測試用戶 ID
    echo "⚠️  使用硬編碼測試用戶 ID"
    # 這些應該從實際的 JWT token 中提取，但為了測試我們先這樣做
fi

# Frank 搜尋 Alice
echo "🔍 4. Frank 搜尋 Alice"
SEARCH_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/users/search?q=Alice" \
  -H "Authorization: Bearer $FRANK_TOKEN")

echo "搜尋結果: $SEARCH_RESPONSE"

# 嘗試從搜尋結果中提取 Alice 的 ID
ALICE_USER_ID_FROM_SEARCH=$(echo "$SEARCH_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ "$ALICE_USER_ID_FROM_SEARCH" != "" ]]; then
    ALICE_USER_ID="$ALICE_USER_ID_FROM_SEARCH"
    echo "✅ 從搜尋結果獲取 Alice User ID: $ALICE_USER_ID"
else
    echo "⚠️  無法從搜尋結果獲取 Alice User ID"
fi
echo ""

# Frank 發送好友邀請給 Alice
echo "📤 5. Frank 發送好友邀請給 Alice"
if [[ "$ALICE_USER_ID" == "" ]]; then
    echo "❌ 無法發送好友邀請 - Alice User ID 未找到"
    exit 1
fi

FRIEND_REQUEST_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/friends/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRANK_TOKEN" \
  -d "{
    \"addresseeId\": \"$ALICE_USER_ID\",
    \"message\": \"Hi Alice, let's be friends!\"
  }")

echo "好友邀請回應: $FRIEND_REQUEST_RESPONSE"

# 檢查是否包含成功的指標
if echo "$FRIEND_REQUEST_RESPONSE" | grep -q "id"; then
    echo "✅ 好友邀請發送成功"
    FRIENDSHIP_ID=$(echo "$FRIEND_REQUEST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Friendship ID: $FRIENDSHIP_ID"
else
    echo "❌ 好友邀請發送失敗"
    echo "回應內容: $FRIEND_REQUEST_RESPONSE"
    exit 1
fi
echo ""

# Alice 查看待處理的好友邀請
echo "📨 6. Alice 查看待處理的好友邀請"
PENDING_REQUESTS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/requests/pending" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Alice 的待處理邀請: $PENDING_REQUESTS_RESPONSE"
echo ""

# Alice 接受好友邀請
echo "✅ 7. Alice 接受好友邀請"
if [[ "$FRIENDSHIP_ID" == "" ]]; then
    echo "❌ 無法接受邀請 - Friendship ID 未找到"
    exit 1
fi

ACCEPT_RESPONSE=$(curl -s -X PUT "$API_BASE/api/v1/friends/request/$FRIENDSHIP_ID/accept" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "接受邀請回應: $ACCEPT_RESPONSE"

if echo "$ACCEPT_RESPONSE" | grep -q "accepted"; then
    echo "✅ 好友邀請接受成功"
else
    echo "❌ 好友邀請接受失敗"
    echo "回應內容: $ACCEPT_RESPONSE"
    exit 1
fi
echo ""

# Frank 查看好友列表
echo "👥 8. Frank 查看好友列表"
FRANK_FRIENDS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $FRANK_TOKEN")

echo "Frank 的好友列表: $FRANK_FRIENDS_RESPONSE"
echo ""

# Alice 查看好友列表
echo "👥 9. Alice 查看好友列表"
ALICE_FRIENDS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/friends/" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Alice 的好友列表: $ALICE_FRIENDS_RESPONSE"
echo ""

# 最終驗證
echo "🎯 10. 最終驗證結果"
echo "=================================="

SUCCESS=true

# 檢查 Frank 的好友列表是否包含 Alice
if ! echo "$FRANK_FRIENDS_RESPONSE" | grep -q "$ALICE_USER_ID"; then
    echo "❌ 驗證失敗: Alice 不在 Frank 的好友列表中"
    SUCCESS=false
else
    echo "✅ Alice 在 Frank 的好友列表中"
fi

# 檢查 Alice 的好友列表是否包含 Frank  
if ! echo "$ALICE_FRIENDS_RESPONSE" | grep -q "$FRANK_USER_ID"; then
    echo "❌ 驗證失敗: Frank 不在 Alice 的好友列表中"  
    SUCCESS=false
else
    echo "✅ Frank 在 Alice 的好友列表中"
fi

if [[ "$SUCCESS" == true ]]; then
    echo ""
    echo "🎉 E2E 測試完全成功!"
    echo "✅ Frank 成功邀請 Alice 為好友"
    echo "✅ Alice 成功接受邀請"
    echo "✅ 雙方好友列表都正確更新"
    echo "✅ 雙向關係驗證成功"
else
    echo ""
    echo "❌ E2E 測試失敗，請檢查上述錯誤"
    exit 1
fi

echo ""
echo "📊 測試總結:"
echo "- Friendship ID: $FRIENDSHIP_ID"
echo "- Frank User ID: $FRANK_USER_ID"
echo "- Alice User ID: $ALICE_USER_ID"
echo "- 雙向關係驗證: ✅"
echo ""
echo "🔍 除錯資訊:"
echo "- Frank Token 長度: ${#FRANK_TOKEN}"
echo "- Alice Token 長度: ${#ALICE_TOKEN}"