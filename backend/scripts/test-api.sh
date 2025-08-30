#!/bin/bash

# Pingnom API 測試腳本
API_BASE="http://localhost:8080"

echo "🚀 開始測試 Pingnom API..."

# 1. 健康檢查
echo "📊 1. 測試健康檢查端點"
curl -s "$API_BASE/health" | jq .
echo ""

# 2. 使用者註冊
echo "👤 2. 測試使用者註冊"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+886912345678",
    "password": "Test123!@#",
    "displayName": "測試使用者"
  }')

echo "$REGISTER_RESPONSE" | jq .

# 提取 userID (如果註冊成功)
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.userId // empty')
echo "註冊的使用者 ID: $USER_ID"
echo ""

# 3. 搜尋使用者 (不需認證)
echo "🔍 3. 測試搜尋使用者"
curl -s "$API_BASE/api/v1/users/search?q=test&limit=5" | jq .
echo ""

# 4. 測試需要認證的端點 (應該會失敗)
echo "🔒 4. 測試未認證存取受保護端點"
curl -s "$API_BASE/api/v1/users/profile" | jq .
echo ""

echo "✅ API 測試完成!"
echo ""
echo "📝 注意事項:"
echo "- 健康檢查應該回傳 200 OK"
echo "- 使用者註冊在沒有資料庫的情況下會失敗"
echo "- 受保護端點應該回傳 401 Unauthorized"
echo "- 實際測試需要先設定 PostgreSQL 資料庫"