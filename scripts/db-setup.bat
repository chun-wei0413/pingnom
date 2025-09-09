@echo off
echo Setting up Pingnom PostgreSQL Development Environment...
echo.

echo Checking if Docker is running...
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running or not installed.
    echo Please install Docker Desktop and make sure it's running.
    echo Download: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker is running.
echo.

echo Starting PostgreSQL containers...
docker-compose -f docker-compose.dev.yml up -d postgres-dev pgadmin

echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

echo Checking PostgreSQL connection...
docker exec pingnom-postgres-dev pg_isready -U pingnom_user -d pingnom_dev
if errorlevel 1 (
    echo ⚠️ PostgreSQL is still starting up. Please wait a moment and try again.
    echo You can check the logs with: docker logs pingnom-postgres-dev
) else (
    echo ✅ PostgreSQL is ready!
)

echo.
echo 📊 Database Setup Complete!
echo.
echo 🔗 Connection Details:
echo   Host: localhost
echo   Port: 5432
echo   Database: pingnom_dev
echo   User: pingnom_user
echo   Password: pingnom_dev_password
echo.
echo 🌐 pgAdmin Web Interface:
echo   URL: http://localhost:5050
echo   Email: admin@pingnom.app
echo   Password: admin123
echo.
echo 📝 Next Steps:
echo   1. Create backend/.env file with PostgreSQL settings
echo   2. Run: go run cmd/api/main.go (when PostgreSQL support is added)
echo   3. Access pgAdmin to manage the database
echo.
echo To stop the database: docker-compose -f docker-compose.dev.yml down
echo.
pause