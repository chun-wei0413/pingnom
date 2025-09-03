#!/bin/bash

echo "========================================"
echo "   Pingnom Robot Framework 測試執行"
echo "========================================"

# 檢查後端服務是否運行
echo "檢查後端服務狀態..."
if ! curl -s http://localhost:8090/health > /dev/null; then
    echo "❌ 錯誤：後端服務未運行，請先啟動後端服務"
    echo "   cd backend && ./main_inmemory"
    exit 1
fi

# 檢查前端服務是否運行
echo "檢查前端服務狀態..."
if ! curl -s http://localhost:19006 > /dev/null; then
    echo "❌ 錯誤：前端服務未運行，請先啟動前端服務"
    echo "   cd frontend && npm start"
    exit 1
fi

echo "✅ 服務檢查通過，開始執行測試..."
echo ""

# 創建結果目錄
mkdir -p results

# 執行測試
echo "🤖 執行 Robot Framework 測試..."
robot \
    --outputdir results \
    --loglevel INFO \
    --include smoke \
    --variable BROWSER:chrome \
    --variable HEADLESS:False \
    --variable APP_URL:http://localhost:8093 \
    features/

if [ $? -eq 0 ]; then
    echo "✅ 測試執行完成"
else
    echo "❌ 測試執行失敗"
fi

echo ""
echo "📊 測試報告位置："
echo "   - HTML報告: results/report.html"
echo "   - 詳細日誌: results/log.html"  
echo "   - 截圖檔案: results/"