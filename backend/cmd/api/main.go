package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	usercommands "github.com/chun-wei0413/pingnom/internal/application/commands/user"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/config"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/persistence"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/routes"
)

func main() {
	// 載入配置
	cfg, err := config.LoadConfig("")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	
	// 建立資料庫連接
	db, err := config.NewDatabase(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	
	// 自動遷移 (開發環境)
	if cfg.Environment == "development" {
		if err := db.AutoMigrate(&persistence.UserModel{}); err != nil {
			log.Fatalf("Failed to migrate database: %v", err)
		}
	}
	
	// 依賴注入 - 建立 Repository
	userRepo := persistence.NewPostgreSQLUserRepository(db)
	
	// 依賴注入 - 建立 Domain Services
	userService := user.NewUserService(userRepo)
	
	// 依賴注入 - 建立 Command Handlers
	registerUserHandler := usercommands.NewRegisterUserHandler(userService)
	updateProfileHandler := usercommands.NewUpdateProfileHandler(userService)
	changePasswordHandler := usercommands.NewChangePasswordHandler(userService)
	
	// 依賴注入 - 建立 Query Handlers
	getUserProfileHandler := userqueries.NewGetUserProfileHandler(userRepo)
	searchUsersHandler := userqueries.NewSearchUsersHandler(userService)
	
	// 依賴注入 - 建立 HTTP Handlers
	userHandler := handlers.NewUserHandler(
		registerUserHandler,
		updateProfileHandler,
		changePasswordHandler,
		getUserProfileHandler,
		searchUsersHandler,
	)
	
	// 依賴注入 - 建立 Middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg)
	
	// 設定 Gin 模式
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	// 建立 HTTP 引擎
	engine := gin.New()
	
	// 全域 Middleware
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())
	engine.Use(middleware.CORS(cfg))
	
	// 設定路由
	router := routes.NewRouter(userHandler, authMiddleware)
	router.SetupRoutes(engine)
	
	// 建立 HTTP 服務器
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      engine,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}
	
	// 在 goroutine 中啟動服務器
	go func() {
		log.Printf("Starting server on %s:%d", cfg.Server.Host, cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()
	
	// 等待中斷信號以優雅地關閉服務器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	
	// 優雅關閉服務器
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()
	
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	
	log.Println("Server exited")
}