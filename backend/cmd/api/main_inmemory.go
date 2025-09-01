package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	authcommands "github.com/chun-wei0413/pingnom/internal/application/commands/auth"
	usercommands "github.com/chun-wei0413/pingnom/internal/application/commands/user"
	friendshipcommands "github.com/chun-wei0413/pingnom/internal/application/commands/friendship"
	pingcommands "github.com/chun-wei0413/pingnom/internal/application/commands/ping"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	friendshipqueries "github.com/chun-wei0413/pingnom/internal/application/queries/friendship"
	pingqueries "github.com/chun-wei0413/pingnom/internal/application/queries/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	friendshipInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	pingInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/routes"
)

func main() {
	// 依賴注入 - 建立 InMemory Repository
	userRepo := inmemory.NewInMemoryUserRepository()
	friendshipRepo := friendshipInmemory.NewInMemoryFriendshipRepository()
	pingRepo := pingInmemory.NewPingRepository()
	
	// 依賴注入 - 建立 Domain Services
	userService := user.NewUserService(userRepo)
	friendshipService := friendship.NewFriendshipService(friendshipRepo)
	pingService := ping.NewService(pingRepo)
	
	// 依賴注入 - 建立 JWT Service
	jwtService := auth.NewJWTService("your-secret-key-here", 24*time.Hour)
	
	// 依賴注入 - 建立 Auth Handlers
	loginHandler := authcommands.NewLoginHandler(userService, jwtService)
	
	// 依賴注入 - 建立 Command Handlers
	registerUserHandler := usercommands.NewRegisterUserHandler(userService)
	updateProfileHandler := usercommands.NewUpdateProfileHandler(userService)
	updatePreferencesHandler := usercommands.NewUpdatePreferencesHandler(userService)
	updatePrivacyHandler := usercommands.NewUpdatePrivacyHandler(userService)
	changePasswordHandler := usercommands.NewChangePasswordHandler(userService)
	
	// 依賴注入 - 建立 Query Handlers
	getUserProfileHandler := userqueries.NewGetUserProfileHandler(userRepo)
	searchUsersHandler := userqueries.NewSearchUsersHandler(userService)
	
	// 依賴注入 - 建立 Friendship Command Handlers
	sendRequestHandler := friendshipcommands.NewSendFriendRequestHandler(friendshipService)
	acceptRequestHandler := friendshipcommands.NewAcceptFriendRequestHandler(friendshipService)
	declineRequestHandler := friendshipcommands.NewDeclineFriendRequestHandler(friendshipService)
	blockUserHandler := friendshipcommands.NewBlockUserHandler(friendshipService)
	removeFriendHandler := friendshipcommands.NewRemoveFriendHandler(friendshipService)
	
	// 依賴注入 - 建立 Friendship Query Handlers
	getFriendsHandler := friendshipqueries.NewGetFriendsHandler(friendshipService)
	getPendingHandler := friendshipqueries.NewGetPendingRequestsHandler(friendshipService)
	getSentHandler := friendshipqueries.NewGetSentRequestsHandler(friendshipService)
	
	// 依賴注入 - 建立 Ping Command Handlers
	createPingHandler := pingcommands.NewCreatePingHandler(pingService)
	respondToPingHandler := pingcommands.NewRespondToPingHandler(pingService)
	
	// 依賴注入 - 建立 Ping Query Handlers
	getUserPingsHandler := pingqueries.NewGetUserPingsHandler(pingService)
	
	// 依賴注入 - 建立 Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtService)
	
	// 依賴注入 - 建立 HTTP Handlers
	authHandler := handlers.NewAuthHandler(loginHandler)
	userHandler := handlers.NewUserHandler(
		registerUserHandler,
		updateProfileHandler,
		updatePreferencesHandler,
		updatePrivacyHandler,
		changePasswordHandler,
		getUserProfileHandler,
		searchUsersHandler,
	)
	friendshipHandler := handlers.NewFriendshipHandler(
		sendRequestHandler,
		acceptRequestHandler,
		declineRequestHandler,
		blockUserHandler,
		removeFriendHandler,
		getFriendsHandler,
		getPendingHandler,
		getSentHandler,
	)
	pingHandler := handlers.NewPingHandler(
		createPingHandler,
		respondToPingHandler,
		getUserPingsHandler,
	)
	
	// 設定 Gin 為開發模式
	gin.SetMode(gin.DebugMode)
	
	// 建立 HTTP 引擎
	engine := gin.New()
	
	// 全域 Middleware
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())
	engine.Use(corsMiddleware())
	
	// 使用新的 Router 來設定路由
	router := routes.NewRouter(userHandler, friendshipHandler, pingHandler, authMiddleware)
	router.SetupRoutes(engine)
	
	// 認證路由 (Public)
	auth := engine.Group("/api/v1/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.POST("/refresh", authHandler.RefreshToken)
	}
	
	// 建立 HTTP 服務器
	server := &http.Server{
		Addr:         ":8090",
		Handler:      engine,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	// 創建測試帳號
	createTestUsers(registerUserHandler)

	// 在 goroutine 中啟動服務器
	go func() {
		log.Printf("🚀 Starting Pingnom API server on :8090 with InMemory Database")
		log.Printf("🌐 Health check: http://localhost:8090/health")
		log.Printf("📋 API base URL: http://localhost:8090/api/v1")
		log.Printf("🧪 Test users: Frank Li (testuser@pingnom.app) & Alice Wang (alice@pingnom.app)")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()
	
	// 等待中斷信號以優雅地關閉服務器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Shutting down server...")
	
	// 優雅關閉服務器
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	
	log.Println("✅ Server exited")
}

// createTestUsers 創建測試帳號
func createTestUsers(registerHandler *usercommands.RegisterUserHandler) {
	ctx := context.Background()
	
	// 創建 Frank Li 測試帳號
	frankCmd := usercommands.RegisterUserCommand{
		Email:       "testuser@pingnom.app",
		Password:    "TestPassword2024!",
		DisplayName: "Frank Li",
	}
	
	if _, err := registerHandler.Handle(ctx, frankCmd); err != nil {
		log.Printf("⚠️  Failed to create Frank Li test user: %v", err)
	} else {
		log.Printf("✅ Created test user: Frank Li (testuser@pingnom.app)")
	}
	
	// 創建 Alice Wang 測試帳號
	aliceCmd := usercommands.RegisterUserCommand{
		Email:       "alice@pingnom.app",
		Password:    "AlicePassword2024!",
		DisplayName: "Alice Wang",
	}
	
	if _, err := registerHandler.Handle(ctx, aliceCmd); err != nil {
		log.Printf("⚠️  Failed to create Alice Wang test user: %v", err)
	} else {
		log.Printf("✅ Created test user: Alice Wang (alice@pingnom.app)")
	}
}

// corsMiddleware 提供簡單的 CORS 支援
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-User-ID")
		c.Header("Access-Control-Allow-Credentials", "true")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}