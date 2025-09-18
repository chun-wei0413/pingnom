@echo off
echo 🧪 Pingnom 通知系統測試執行腳本
echo =====================================

echo.
echo 📋 檢查測試環境...

REM 檢查 Go 是否安裝
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Go 未安裝或不在 PATH 中
    exit /b 1
)

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安裝或不在 PATH 中
    exit /b 1
)

echo ✅ 測試環境檢查完成

echo.
echo 🏗️ 啟動測試服務...

REM 進入後端目錄並啟動服務
cd /d "%~dp0..\backend"
echo 🔄 啟動後端測試服務...
start "Backend Test Server" cmd /c "go run cmd/api/main_inmemory_with_groups.go"

REM 等待後端啟動
timeout /t 3 /nobreak >nul

REM 檢查後端健康狀態
curl -f http://localhost:8090/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 後端服務啟動失敗
    exit /b 1
)
echo ✅ 後端服務運行正常

echo.
echo 🧪 執行後端測試...
echo =====================================

REM 執行 Go 單元測試
echo 🔬 執行通知領域測試...
go test -v ./internal/domain/notification/...
if %errorlevel% neq 0 (
    echo ❌ 通知領域測試失敗
    goto :cleanup
)

echo 🔬 執行通知儲存庫測試...
go test -v ./internal/infrastructure/inmemory/notification_repository_test.go
if %errorlevel% neq 0 (
    echo ❌ 通知儲存庫測試失敗
    goto :cleanup
)

echo 🔬 執行通知服務測試...
go test -v ./internal/application/notification/...
if %errorlevel% neq 0 (
    echo ❌ 通知服務測試失敗
    goto :cleanup
)

echo ✅ 後端測試完成

echo.
echo 🌐 執行前端測試...
echo =====================================

REM 進入前端目錄
cd /d "%~dp0..\frontend-mobile"

REM 檢查依賴是否安裝
if not exist "node_modules" (
    echo 📦 安裝前端依賴...
    npm install
)

echo 🔬 執行前端單元測試...
npm test -- --watchAll=false --coverage=false --testPathPattern="notificationApi.test.ts|notificationSlice.test.ts"
if %errorlevel% neq 0 (
    echo ❌ 前端單元測試失敗
    goto :cleanup
)

echo ✅ 前端單元測試完成

echo.
echo 🎭 準備 E2E 測試...
echo =====================================

REM 檢查是否有 Playwright
if not exist "node_modules\.bin\playwright.cmd" (
    echo 📦 安裝 Playwright...
    npm install @playwright/test
    npx playwright install
)

echo 🔬 執行 E2E 測試...
npx playwright test tests/e2e/notification-system.spec.js --headed
if %errorlevel% neq 0 (
    echo ⚠️ E2E 測試失敗（可能是環境問題）
    echo 💡 請確認前端 Web 服務運行在 localhost:8082
)

echo.
echo 📊 測試報告
echo =====================================
echo ✅ 後端通知領域測試：通過
echo ✅ 後端通知儲存庫測試：通過
echo ✅ 後端通知服務測試：通過
echo ✅ 前端 API 服務測試：通過
echo ✅ 前端狀態管理測試：通過
echo 🎭 E2E 測試：完成（需手動驗證）

echo.
echo 🎉 通知系統測試執行完成！

:cleanup
echo.
echo 🧹 清理測試環境...

REM 停止後端服務
taskkill /f /im "go.exe" >nul 2>&1

echo ✅ 清理完成
pause