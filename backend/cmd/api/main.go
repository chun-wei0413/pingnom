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
	authcommands "github.com/chun-wei0413/pingnom/internal/application/commands/auth"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/config"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
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
	
	// 依賴注入 - 建立 InMemory Repository
	userRepo := inmemory.NewInMemoryUserRepository()
	
	// 依賴注入 - 建立 JWT Service
	jwtService := auth.NewJWTService("your-secret-key", 24) // 24小時過期
	
	// 依賴注入 - 建立 Domain Services
	userService := user.NewUserService(userRepo)
	
	// 依賴注入 - 建立 Command Handlers
	registerUserHandler := usercommands.NewRegisterUserHandler(userService)
	updateProfileHandler := usercommands.NewUpdateProfileHandler(userService)
	updatePreferencesHandler := usercommands.NewUpdatePreferencesHandler(userService)
	updatePrivacyHandler := usercommands.NewUpdatePrivacyHandler(userService)
	changePasswordHandler := usercommands.NewChangePasswordHandler(userService)
	
	// 依賴注入 - 建立 Query Handlers
	getUserProfileHandler := userqueries.NewGetUserProfileHandler(userRepo)
	searchUsersHandler := userqueries.NewSearchUsersHandler(userService)
	
	// 依賴注入 - 建立 HTTP Handlers
	userHandler := handlers.NewUserHandler(
		registerUserHandler,
		updateProfileHandler,
		updatePreferencesHandler,
		updatePrivacyHandler,
		changePasswordHandler,
		getUserProfileHandler,
		searchUsersHandler,
	)
	
	// 依賴注入 - 建立 Auth Command Handlers
	loginHandler := authcommands.NewLoginHandler(userService, jwtService)
	
	// 依賴注入 - 建立 Auth HTTP Handler
	authHandler := handlers.NewAuthHandler(loginHandler)
	friendshipHandler := &handlers.FriendshipHandler{}
	pingHandler := &handlers.PingHandler{}
	restaurantHandler := &handlers.RestaurantHandler{}
	
	// 建立測試帳號
	ctx := context.Background()
	testUser1, err := userService.RegisterUser(ctx, "testuser@pingnom.app", "", "TestPassword2024!", "Frank Li")
	if err != nil {
		log.Printf("Failed to create test user Frank Li: %v", err)
	} else {
		log.Printf("Test user Frank Li created successfully: %s", testUser1.ID.String())
	}
	
	testUser2, err := userService.RegisterUser(ctx, "alice@pingnom.app", "", "AlicePassword2024!", "Alice Wang")
	if err != nil {
		log.Printf("Failed to create test user Alice Wang: %v", err)
	} else {
		log.Printf("Test user Alice Wang created successfully: %s", testUser2.ID.String())
	}
	
	// 依賴注入 - 建立 Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtService)
	
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
	router := routes.NewRouter(userHandler, authHandler, friendshipHandler, pingHandler, restaurantHandler, authMiddleware)
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