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
	billcommands "github.com/chun-wei0413/pingnom/internal/application/commands/bill"
	groupcommands "github.com/chun-wei0413/pingnom/internal/application/commands/group"
	activitycommands "github.com/chun-wei0413/pingnom/internal/application/commands/activity"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	friendshipqueries "github.com/chun-wei0413/pingnom/internal/application/queries/friendship"
	pingqueries "github.com/chun-wei0413/pingnom/internal/application/queries/ping"
	restaurantqueries "github.com/chun-wei0413/pingnom/internal/application/queries/restaurant"
	billqueries "github.com/chun-wei0413/pingnom/internal/application/queries/bill"
	groupqueries "github.com/chun-wei0413/pingnom/internal/application/queries/group"
	activityqueries "github.com/chun-wei0413/pingnom/internal/application/queries/activity"
	notificationApp "github.com/chun-wei0413/pingnom/internal/application/notification"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	friendshipInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	pingInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	restaurantInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	inmemorypersistence "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	httphandlers "github.com/chun-wei0413/pingnom/internal/interfaces/http"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/routes"
	websockethandlers "github.com/chun-wei0413/pingnom/internal/interfaces/websocket"

	// Group Dining imports
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/services"
	groupdiningrepos "github.com/chun-wei0413/pingnom/internal/infrastructure/groupdining/repositories"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/controllers"
)

func main() {
	ctx := context.Background()

	gin.SetMode(gin.DebugMode)

	// === 建立儲存庫 ===
	userRepo := inmemory.NewUserRepository()
	friendshipRepo := friendshipInmemory.NewFriendshipRepository()
	pingRepo := pingInmemory.NewPingRepository()
	restaurantRepo := restaurantInmemory.NewRestaurantRepository()
	billRepo := inmemorypersistence.NewBillRepository()
	groupRepo := inmemorypersistence.NewGroupRepository()
	activityRepo := inmemorypersistence.NewActivityHistoryRepository()

	// 新增通知儲存庫
	notificationRepo := inmemory.NewNotificationRepository()

	// === 建立 Group Dining 儲存庫 ===
	groupDiningPlanRepo := groupdiningrepos.NewInMemoryGroupDiningPlanRepository()
	voteRepo := groupdiningrepos.NewInMemoryVoteRepository()

	// === 建立認證服務 ===
	tokenGen := auth.NewJWTTokenGenerator("your-secret-key")

	// === 建立 WebSocket Hub ===
	notificationHub := notification.NewHub(ctx)
	go notificationHub.Run() // 啟動 Hub

	// === 建立應用服務 ===
	// User services
	createUserUseCase := usercommands.NewCreateUserUseCase(userRepo)
	getUserByIDQuery := userqueries.NewGetUserByIDQuery(userRepo)
	updateUserUseCase := usercommands.NewUpdateUserUseCase(userRepo)
	searchUsersQuery := userqueries.NewSearchUsersQuery(userRepo)

	// Auth services
	loginUseCase := authcommands.NewLoginUseCase(userRepo, tokenGen)
	registerUseCase := authcommands.NewRegisterUseCase(userRepo)

	// Friendship services
	sendFriendRequestUseCase := friendshipcommands.NewSendFriendRequestUseCase(friendshipRepo, userRepo)
	acceptFriendRequestUseCase := friendshipcommands.NewAcceptFriendRequestUseCase(friendshipRepo)
	declineFriendRequestUseCase := friendshipcommands.NewDeclineFriendRequestUseCase(friendshipRepo)
	getFriendshipsQuery := friendshipqueries.NewGetFriendshipsQuery(friendshipRepo)
	searchFriendsQuery := friendshipqueries.NewSearchFriendsQuery(friendshipRepo, userRepo)

	// Ping services
	createPingUseCase := pingcommands.NewCreatePingUseCase(pingRepo, userRepo, friendshipRepo)
	respondToPingUseCase := pingcommands.NewRespondToPingUseCase(pingRepo)
	getPingsQuery := pingqueries.NewGetPingsQuery(pingRepo, userRepo)

	// Restaurant services
	searchRestaurantsQuery := restaurantqueries.NewSearchRestaurantsQuery(restaurantRepo)

	// Bill services
	createBillUseCase := billcommands.NewCreateBillUseCase(billRepo, userRepo)
	addBillParticipantUseCase := billcommands.NewAddBillParticipantUseCase(billRepo)
	addBillItemUseCase := billcommands.NewAddBillItemUseCase(billRepo)
	updatePaymentStatusUseCase := billcommands.NewUpdatePaymentStatusUseCase(billRepo)
	getBillsQuery := billqueries.NewGetBillsQuery(billRepo)
	getBillByIDQuery := billqueries.NewGetBillByIDQuery(billRepo)

	// Group services
	createGroupUseCase := groupcommands.NewCreateGroupUseCase(groupRepo, userRepo)
	addGroupMemberUseCase := groupcommands.NewAddGroupMemberUseCase(groupRepo, userRepo)
	removeGroupMemberUseCase := groupcommands.NewRemoveGroupMemberUseCase(groupRepo)
	getGroupsQuery := groupqueries.NewGetGroupsQuery(groupRepo)
	getGroupByIDQuery := groupqueries.NewGetGroupByIDQuery(groupRepo)
	searchGroupsQuery := groupqueries.NewSearchGroupsQuery(groupRepo)

	// Group Dining services
	groupDiningService := services.NewGroupDiningService(groupDiningPlanRepo, voteRepo, userRepo, groupRepo)

	// Activity services
	createActivityHistoryUseCase := activitycommands.NewCreateActivityHistoryUseCase(activityRepo)
	updateActivityHistoryUseCase := activitycommands.NewUpdateActivityHistoryUseCase(activityRepo)
	getUserActivityHistoryQuery := activityqueries.NewGetUserActivityHistoryQuery(activityRepo)

	// 通知服務
	notificationService := notificationApp.NewService(notificationRepo, notificationHub)

	// === 建立 HTTP 處理器 ===
	userHandler := handlers.NewUserHandler(
		createUserUseCase,
		getUserByIDQuery,
		updateUserUseCase,
		searchUsersQuery,
		loginUseCase,
		registerUseCase,
	)

	friendshipHandler := handlers.NewFriendshipHandler(
		sendFriendRequestUseCase,
		acceptFriendRequestUseCase,
		declineFriendRequestUseCase,
		getFriendshipsQuery,
		searchFriendsQuery,
	)

	pingHandler := handlers.NewPingHandler(
		createPingUseCase,
		respondToPingUseCase,
		getPingsQuery,
	)

	restaurantHandler := handlers.NewRestaurantHandler(searchRestaurantsQuery)

	billHandler := handlers.NewBillHandler(
		createBillUseCase,
		addBillParticipantUseCase,
		addBillItemUseCase,
		updatePaymentStatusUseCase,
		getBillsQuery,
		getBillByIDQuery,
	)

	groupHandler := handlers.NewGroupHandler(
		createGroupUseCase,
		addGroupMemberUseCase,
		removeGroupMemberUseCase,
		getGroupsQuery,
		getGroupByIDQuery,
		searchGroupsQuery,
	)

	groupDiningController := controllers.NewGroupDiningController(groupDiningService)

	activityHandler := handlers.NewActivityHistoryHandler(
		createActivityHistoryUseCase,
		updateActivityHistoryUseCase,
		getUserActivityHistoryQuery,
	)

	// 通知處理器
	notificationHandler := httphandlers.NewNotificationHandler(notificationService)
	websocketHandler := websockethandlers.NewHandler(notificationHub, notificationService)

	// === 建立測試用戶 ===
	createTestUsers(userRepo)

	// === 設置路由 ===
	router := gin.Default()

	// CORS 中間件
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 健康檢查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": "pingnom-api", "status": "ok"})
	})

	// WebSocket 端點
	router.GET("/ws", middleware.AuthMiddleware(tokenGen), websocketHandler.HandleWebSocket)

	// API 路由
	apiV1 := router.Group("/api/v1")

	// 應用所有路由
	routes.ApplyUserRoutes(apiV1, userHandler, tokenGen)
	routes.ApplyFriendshipRoutes(apiV1, friendshipHandler, tokenGen)
	routes.ApplyPingRoutes(apiV1, pingHandler, tokenGen)
	routes.ApplyRestaurantRoutes(apiV1, restaurantHandler, tokenGen)
	routes.ApplyBillRoutes(apiV1, billHandler, tokenGen)
	routes.ApplyGroupRoutes(apiV1, groupHandler, tokenGen)
	routes.ApplyGroupDiningRoutes(apiV1, groupDiningController, tokenGen)
	routes.ApplyActivityHistoryRoutes(apiV1, activityHandler, tokenGen)

	// 通知路由
	notificationRoutes := apiV1.Group("/notifications")
	notificationRoutes.Use(middleware.AuthMiddleware(tokenGen))
	{
		notificationRoutes.GET("", notificationHandler.GetNotifications)
		notificationRoutes.GET("/unread-count", notificationHandler.GetUnreadCount)
		notificationRoutes.PUT("/:id/read", notificationHandler.MarkAsRead)
		notificationRoutes.PUT("/read-all", notificationHandler.MarkAllAsRead)
		notificationRoutes.POST("/test", notificationHandler.TestNotification)
		notificationRoutes.POST("", notificationHandler.CreateNotification)
		notificationRoutes.POST("/broadcast", notificationHandler.BroadcastSystemNotification)
	}

	// 管理路由
	adminRoutes := apiV1.Group("/admin")
	adminRoutes.Use(middleware.AuthMiddleware(tokenGen))
	{
		adminRoutes.GET("/online-users", websocketHandler.GetOnlineUsers)
	}

	// 啟動服務器
	server := &http.Server{
		Addr:    ":8090",
		Handler: router,
	}

	// 優雅關閉
	go func() {
		log.Println("🚀 Server starting on :8090")
		log.Println("📡 WebSocket endpoint: ws://localhost:8090/ws")
		log.Println("🔔 Notification system enabled")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// 等待中斷信號
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// 5秒內優雅關閉
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("✅ Server exited")
}

func createTestUsers(userRepo user.Repository) {
	ctx := context.Background()

	// 檢查是否已存在測試用戶
	existingUsers, _ := userRepo.GetAll(ctx)
	if len(existingUsers) > 0 {
		log.Println("📋 Test users already exist, skipping creation")
		return
	}

	// 創建 Frank Li 測試用戶
	frankUser, err := user.NewUser("testuser@pingnom.app", "TestPassword2024!", "Frank Li")
	if err != nil {
		log.Printf("❌ Failed to create Frank Li user: %v", err)
		return
	}

	if err := userRepo.Create(ctx, frankUser); err != nil {
		log.Printf("❌ Failed to save Frank Li user: %v", err)
		return
	}

	// 創建 Alice Wang 測試用戶
	aliceUser, err := user.NewUser("alice@pingnom.app", "AlicePassword2024!", "Alice Wang")
	if err != nil {
		log.Printf("❌ Failed to create Alice Wang user: %v", err)
		return
	}

	if err := userRepo.Create(ctx, aliceUser); err != nil {
		log.Printf("❌ Failed to save Alice Wang user: %v", err)
		return
	}

	log.Println("👥 Test users created successfully:")
	log.Printf("   📧 Frank Li: testuser@pingnom.app (ID: %s)", frankUser.ID.String())
	log.Printf("   📧 Alice Wang: alice@pingnom.app (ID: %s)", aliceUser.ID.String())
}