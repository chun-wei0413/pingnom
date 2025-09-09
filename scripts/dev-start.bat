@echo off
echo Starting Pingnom Development Environment...
echo.

echo Starting Backend API Server...
cd backend
start cmd /k "echo Backend API Server && go run cmd/api/main_inmemory.go"
cd ..

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Mobile App...
cd frontend-mobile
start cmd /k "echo Frontend Mobile App && npm start"
cd ..

echo.
echo ✅ Development servers are starting...
echo.
echo 📡 Backend API: http://localhost:8090
echo 📱 Frontend Mobile: http://localhost:8100
echo 🔍 Health Check: http://localhost:8090/health
echo.
echo 🧪 Test Accounts:
echo   📧 Frank Li: testuser@pingnom.app / TestPassword2024!
echo   📧 Alice Wang: alice@pingnom.app / AlicePassword2024!
echo.
echo Press any key to close this window...
pause >nul