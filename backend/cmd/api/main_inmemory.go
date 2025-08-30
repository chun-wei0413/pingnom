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
	usercommands "github.com/chun-wei0413/pingnom/internal/application/commands/user"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
)

func main() {
	// 依賴注入 - 建立 InMemory Repository
	userRepo := inmemory.NewInMemoryUserRepository()
	
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
	
	// 設定 Gin 為開發模式
	gin.SetMode(gin.DebugMode)
	
	// 建立 HTTP 引擎
	engine := gin.New()
	
	// 全域 Middleware
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())
	engine.Use(corsMiddleware())
	
	// 健康檢查端點
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "Pingnom API is running with InMemory Database",
			"timestamp": time.Now().UTC(),
		})
	})
	
	// API 路由群組
	api := engine.Group("/api/v1")
	{
		// 使用者路由
		users := api.Group("/users")
		{
			users.POST("/register", userHandler.Register)
			users.GET("/search", userHandler.SearchUsers)
			users.GET("/profile/:id", userHandler.GetProfile)
		}
	}
	
	// 建立 HTTP 服務器
	server := &http.Server{
		Addr:         ":8090",
		Handler:      engine,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	// 在 goroutine 中啟動服務器
	go func() {
		log.Printf("🚀 Starting Pingnom API server on :8090 with InMemory Database")
		log.Printf("🌐 Health check: http://localhost:8090/health")
		log.Printf("📋 API base URL: http://localhost:8090/api/v1")
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

// corsMiddleware 提供簡單的 CORS 支援
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}