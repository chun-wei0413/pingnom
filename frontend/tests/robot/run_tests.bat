@echo off
echo ========================================
echo    Pingnom Robot Framework 測試執行
echo ========================================

:: 檢查後端服務是否運行
echo 檢查後端服務狀態...
curl -s http://localhost:8090/health > nul
if errorlevel 1 (
    echo ❌ 錯誤：後端服務未運行，請先啟動後端服務
    echo    cd backend && ./main_inmemory.exe
    pause
    exit /b 1
)

:: 檢查前端服務是否運行  
echo 檢查前端服務狀態...
curl -s http://localhost:19006 > nul
if errorlevel 1 (
    echo ❌ 錯誤：前端服務未運行，請先啟動前端服務
    echo    cd frontend && npm start
    pause
    exit /b 1
)

echo ✅ 服務檢查通過，開始執行測試...
echo.

:: 創建結果目錄
if not exist results mkdir results

:: 執行測試
echo 🤖 執行 Robot Framework 測試...
robot ^
    --outputdir results ^
    --loglevel INFO ^
    --include smoke ^
    --variable BROWSER:chrome ^
    --variable HEADLESS:False ^
    --variable APP_URL:http://localhost:8093 ^
    features/

if errorlevel 1 (
    echo ❌ 測試執行失敗
) else (
    echo ✅ 測試執行完成
)

echo.
echo 📊 測試報告位置：
echo    - HTML報告: results/report.html
echo    - 詳細日誌: results/log.html
echo    - 截圖檔案: results/

pause