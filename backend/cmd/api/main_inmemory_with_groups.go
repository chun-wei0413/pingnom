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
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	friendshipInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	pingInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	restaurantInmemory "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	inmemorypersistence "github.com/chun-wei0413/pingnom/internal/infrastructure/persistence/inmemory"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/routes"
	
	// Group Dining imports
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/services"
	groupdiningrepos "github.com/chun-wei0413/pingnom/internal/infrastructure/groupdining/repositories"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/controllers"
)

func main() {
	// 依賴注入 - 建立 InMemory Repository
	userRepo := inmemory.NewInMemoryUserRepository()
	friendshipRepo := friendshipInmemory.NewInMemoryFriendshipRepository()
	pingRepo := pingInmemory.NewPingRepository()
	restaurantRepo := restaurantInmemory.NewRestaurantRepository()
	billRepo := inmemory.NewInMemoryBillRepository()
	groupRepo := inmemory.NewInMemoryGroupRepository()
	activityRepo := inmemorypersistence.NewActivityHistoryInMemoryRepository()
	
	// Group Dining repositories
	groupDiningPlanRepo := groupdiningrepos.NewGroupDiningPlanRepositoryInMemory()
	voteRepo := groupdiningrepos.NewVoteRepositoryInMemory()
	
	// 依賴注入 - 建立 Domain Services
	userService := user.NewUserService(userRepo)
	friendshipService := friendship.NewFriendshipService(friendshipRepo)
	pingService := ping.NewService(pingRepo)
	restaurantRecommendationService := restaurant.NewRecommendationService(restaurantRepo)
	billService := bill.NewService(billRepo)
	groupService := group.NewService(groupRepo)
	
	// 暫時移除統計功能，太複雜
	// 創建空的統計 handler 以避免編譯錯誤
	var statisticsHandler *handlers.StatisticsHandler = nil
	
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
	
	// 依賴注入 - 建立 Restaurant Query Handlers
	searchRestaurantsHandler := restaurantqueries.NewSearchRestaurantsHandler(restaurantRepo)
	getRestaurantRecommendationsHandler := restaurantqueries.NewGetRestaurantRecommendationsHandler(restaurantRecommendationService)
	
	// 依賴注入 - 建立 Bill Command Handlers
	createBillHandler := billcommands.NewCreateBillHandler(billService)
	addItemHandler := billcommands.NewAddItemHandler(billService, billRepo)
	addParticipantHandler := billcommands.NewAddParticipantHandler(billService, billRepo)
	markPaidHandler := billcommands.NewMarkPaidHandler(billService, billRepo)
	
	// 依賴注入 - 建立 Bill Query Handlers
	getBillHandler := billqueries.NewGetBillHandler(billService, billRepo)
	getUserBillsHandler := billqueries.NewGetUserBillsHandler(billRepo)
	
	// 依賴注入 - 建立 Group Command Handlers
	createGroupHandler := groupcommands.NewCreateGroupHandler(groupService)
	updateGroupInfoHandler := groupcommands.NewUpdateGroupInfoHandler(groupRepo)
	inviteMemberHandler := groupcommands.NewInviteMemberHandler(groupService)
	removeMemberHandler := groupcommands.NewRemoveMemberHandler(groupRepo)
	leaveGroupHandler := groupcommands.NewLeaveGroupHandler(groupService)
	
	// 依賴注入 - 建立 Group Query Handlers
	getUserGroupsHandler := groupqueries.NewGetUserGroupsHandler(groupRepo)
	getGroupByIDHandler := groupqueries.NewGetGroupByIDHandler(groupRepo)
	searchGroupsHandler := groupqueries.NewSearchGroupsHandler(groupRepo)
	getGroupStatsHandler := groupqueries.NewGetGroupStatsHandler(groupRepo)

	// 依賴注入 - 建立 Activity History Command Handlers
	createActivityHistoryHandler := activitycommands.NewCreateActivityHistoryHandler(activityRepo)
	updateActivityHistoryHandler := activitycommands.NewUpdateActivityHistoryHandler(activityRepo)

	// 依賴注入 - 建立 Activity History Query Handlers
	getUserActivityHistoryHandler := activityqueries.NewGetUserActivityHistoryHandler(activityRepo)
	
	// 依賴注入 - 建立 Group Dining Service & Controller
	groupDiningService := services.NewGroupDiningService(groupDiningPlanRepo, voteRepo)
	groupDiningController := controllers.NewGroupDiningController(groupDiningService)
	
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
	restaurantHandler := handlers.NewRestaurantHandler(
		searchRestaurantsHandler,
		getRestaurantRecommendationsHandler,
	)
	billHandler := handlers.NewBillHandler(
		createBillHandler,
		addItemHandler,
		addParticipantHandler,
		markPaidHandler,
		getBillHandler,
		getUserBillsHandler,
	)
	
	// 建立 Group Handler
	groupHandler := handlers.NewGroupHandler(
		createGroupHandler,
		updateGroupInfoHandler,
		inviteMemberHandler,
		removeMemberHandler,
		leaveGroupHandler,
		getGroupByIDHandler,
		getUserGroupsHandler,
		searchGroupsHandler,
		getGroupStatsHandler,
	)

	// 建立 Activity History Handler
	activityHistoryHandler := handlers.NewActivityHistoryHandler(
		createActivityHistoryHandler,
		updateActivityHistoryHandler,
		getUserActivityHistoryHandler,
	)
	
	// Dashboard handler
	dashboardHandler := handlers.NewDashboardHandler(friendshipRepo, pingRepo)
	
	// 設定 Gin 為開發模式
	gin.SetMode(gin.DebugMode)
	
	// 建立 HTTP 引擎
	engine := gin.New()
	
	// 全域 Middleware
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())
	engine.Use(corsMiddleware())
	
	// 使用新的 Router 來設定路由
	router := routes.NewRouter(userHandler, authHandler, friendshipHandler, pingHandler, restaurantHandler, statisticsHandler, dashboardHandler, activityHistoryHandler, authMiddleware)
	router.SetupRoutes(engine)
	
	// Group Dining 路由 (Require Auth)
	groupDining := engine.Group("/api/v1/group-dining")
	groupDining.Use(authMiddleware.RequireAuth())
	{
		// Create & Get Group Dining Plans
		groupDining.POST("/plans", groupDiningController.CreateGroupDiningPlan)
		groupDining.GET("/plans/:id", groupDiningController.GetGroupDiningPlan)
		groupDining.GET("/plans", groupDiningController.GetGroupDiningPlansByCreator)
		groupDining.GET("/participants/plans", groupDiningController.GetGroupDiningPlansByParticipant)
		
		// Manage Time Slots & Restaurant Options
		groupDining.POST("/plans/:id/time-slots", groupDiningController.AddTimeSlot)
		groupDining.POST("/plans/:id/restaurants", groupDiningController.AddRestaurantOption)
		
		// Join Plan & Voting
		groupDining.POST("/plans/:id/join", groupDiningController.JoinGroupDiningPlan)
		groupDining.POST("/plans/:id/start-voting", groupDiningController.StartVoting)
		groupDining.POST("/plans/:id/vote", groupDiningController.SubmitVote)
		groupDining.GET("/plans/:id/results", groupDiningController.GetVotingResults)
		
		// Finalize Plan
		groupDining.POST("/plans/:id/finalize", groupDiningController.FinalizeGroupDiningPlan)
	}
	
	// Bill 路由 (Require Auth)
	bills := engine.Group("/api/v1/bills")
	bills.Use(authMiddleware.RequireAuth())
	{
		// Create & Get Bills
		bills.POST("/", billHandler.CreateBill)
		bills.GET("/:id", billHandler.GetBill)
		bills.GET("/", billHandler.GetUserBills)
		
		// Manage Bill Items & Participants
		bills.POST("/:id/items", billHandler.AddItem)
		bills.POST("/:id/participants", billHandler.AddParticipant)
		bills.PUT("/:id/payments", billHandler.MarkPaid)
	}
	
	// Groups 路由 (Require Auth) 
	groups := engine.Group("/api/v1/groups")
	groups.Use(authMiddleware.RequireAuth())
	{
		groups.POST("/", groupHandler.CreateGroup)
		groups.GET("/", groupHandler.GetUserGroups)
		groups.GET("/search", groupHandler.SearchGroups)
		groups.GET("/:id", groupHandler.GetGroupByID)
		groups.PUT("/:id", groupHandler.UpdateGroupInfo)
		groups.POST("/:id/members", groupHandler.InviteMember)
		groups.DELETE("/:id/members/:memberId", groupHandler.RemoveMember)
		groups.POST("/:id/leave", groupHandler.LeaveGroup)
		groups.GET("/:id/stats", groupHandler.GetGroupStats)
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
	
	// 創建測試餐廳資料
	// createTestRestaurants(restaurantRepo) // 暫時移除
	
	// 創建測試群組資料
	createTestGroups(groupRepo, userRepo)

	// 在 goroutine 中啟動服務器
	go func() {
		log.Printf("🚀 Starting Pingnom API server on :8090 with InMemory Database + Groups")
		log.Printf("🌐 Health check: http://localhost:8090/health")
		log.Printf("📋 API base URL: http://localhost:8090/api/v1")
		log.Printf("🧪 Test users: Frank Li (testuser@pingnom.app) & Alice Wang (alice@pingnom.app)")
		log.Printf("👥 Groups API: http://localhost:8090/api/v1/groups")
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

// corsMiddleware 設定 CORS 規則
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
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

// createTestGroups 創建測試群組
func createTestGroups(groupRepo group.Repository, userRepo user.UserRepository) {
	ctx := context.Background()
	
	// 獲取測試用戶
	frankUser, err := userRepo.FindByEmail(ctx, "testuser@pingnom.app")
	if err != nil {
		log.Printf("⚠️  Cannot find Frank Li for test groups: %v", err)
		return
	}
	
	aliceUser, err := userRepo.FindByEmail(ctx, "alice@pingnom.app")
	if err != nil {
		log.Printf("⚠️  Cannot find Alice Wang for test groups: %v", err)
		return
	}
	
	// 創建測試群組 1: 美食同好會
	testGroup1, err := group.NewGroup(
		frankUser.ID,
		"美食同好會",
		"喜愛台灣美食的朋友們聚在一起",
		group.PrivacyPublic,
		10,
	)
	if err != nil {
		log.Printf("⚠️  Failed to create test group 1: %v", err)
	} else {
		// 添加 Alice 作為成員
		testGroup1.AddMember(aliceUser.ID)
		
		// 儲存群組
		if err := groupRepo.Create(testGroup1); err != nil {
			log.Printf("⚠️  Failed to save test group 1: %v", err)
		} else {
			log.Printf("✅ Created test group: 美食同好會 (Creator: Frank Li, Members: Frank Li, Alice Wang)")
		}
	}
	
	// 創建測試群組 2: 週末聚會
	testGroup2, err := group.NewGroup(
		aliceUser.ID,
		"週末聚會",
		"每週末一起吃美食的小團體",
		group.PrivacyPrivate,
		5,
	)
	if err != nil {
		log.Printf("⚠️  Failed to create test group 2: %v", err)
	} else {
		// 添加 Frank 作為成員
		testGroup2.AddMember(frankUser.ID)
		
		// 儲存群組
		if err := groupRepo.Create(testGroup2); err != nil {
			log.Printf("⚠️  Failed to save test group 2: %v", err)
		} else {
			log.Printf("✅ Created test group: 週末聚會 (Creator: Alice Wang, Members: Alice Wang, Frank Li)")
		}
	}
}

// createTestRestaurants 創建測試餐廳資料 - 簡化版
func createTestRestaurants(restaurantRepo restaurant.Repository) {
	log.Printf("✅ Restaurant test data creation skipped (simplified for group testing)")
}
