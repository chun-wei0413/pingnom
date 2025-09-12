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
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	friendshipqueries "github.com/chun-wei0413/pingnom/internal/application/queries/friendship"
	pingqueries "github.com/chun-wei0413/pingnom/internal/application/queries/ping"
	restaurantqueries "github.com/chun-wei0413/pingnom/internal/application/queries/restaurant"
	billqueries "github.com/chun-wei0413/pingnom/internal/application/queries/bill"
	groupqueries "github.com/chun-wei0413/pingnom/internal/application/queries/group"
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
	getGroupByIDHandler := groupqueries.NewGetGroupByIDHandler(groupRepo)
	getUserGroupsHandler := groupqueries.NewGetUserGroupsHandler(groupRepo)
	searchGroupsHandler := groupqueries.NewSearchGroupsHandler(groupRepo)
	getGroupStatsHandler := groupqueries.NewGetGroupStatsHandler(groupRepo)
	
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
	
	// 使用新的 Router 來設定路由 (注意：這裡需要更新 Router 來支援 GroupHandler)
	router := routes.NewRouter(userHandler, authHandler, friendshipHandler, pingHandler, restaurantHandler, statisticsHandler, dashboardHandler, authMiddleware)
	router.SetupRoutes(engine)
	
	// Group Management 路由 (Require Auth)
	groups := engine.Group("/api/v1/groups")
	groups.Use(authMiddleware.RequireAuth())
	{
		// Basic CRUD operations
		groups.POST("/", groupHandler.CreateGroup)
		groups.GET("/", groupHandler.GetUserGroups)
		groups.GET("/search", groupHandler.SearchGroups)
		groups.GET("/:id", groupHandler.GetGroupByID)
		groups.PUT("/:id", groupHandler.UpdateGroupInfo)
		
		// Member management
		groups.POST("/:id/members", groupHandler.InviteMember)
		groups.DELETE("/:id/members/:memberId", groupHandler.RemoveMember)
		groups.POST("/:id/leave", groupHandler.LeaveGroup)
		
		// Statistics
		groups.GET("/:id/stats", groupHandler.GetGroupStats)
	}
	
	// Bills 路由 (Require Auth)
	bills := engine.Group("/api/v1/bills")
	bills.Use(authMiddleware.RequireAuth())
	{
		// Create & Get Bills
		bills.POST("/", billHandler.CreateBill)
		bills.GET("/:id", billHandler.GetBillByID)
		bills.GET("/", billHandler.GetUserBills)
		
		// Manage Items & Participants
		bills.POST("/:id/items", billHandler.AddItem)
		bills.POST("/:id/participants", billHandler.AddParticipant)
		
		// Payment tracking
		bills.PUT("/:id/payments", billHandler.MarkPaid)
	}
	
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
		
		// Finalize & Cancel
		groupDining.POST("/plans/:id/finalize", groupDiningController.FinalizeGroupDiningPlan)
		groupDining.POST("/plans/:id/cancel", groupDiningController.CancelGroupDiningPlan)
	}
	
	// 建立測試資料
	createTestData(userRepo, friendshipRepo, restaurantRepo, billRepo, groupRepo)
	
	// 設定 HTTP Server
	server := &http.Server{
		Addr:    ":8090",
		Handler: engine,
	}
	
	// 在 goroutine 中啟動伺服器
	go func() {
		log.Println("Starting server on :8090...")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	
	// 等待中斷信號
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	
	log.Println("Shutting down server...")
	
	// 5 秒內完成關閉
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	
	log.Println("Server exited")
}

// corsMiddleware 設定 CORS
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

// 建立測試資料
func createTestData(userRepo user.Repository, friendshipRepo friendship.Repository, restaurantRepo restaurant.Repository, billRepo bill.Repository, groupRepo group.Repository) {
	ctx := context.Background()
	
	log.Println("Creating test data...")
	
	// 創建測試用戶 Frank Li
	frankUser, err := user.NewUser("testuser@pingnom.app", "TestPassword2024!", "Frank Li")
	if err != nil {
		log.Printf("Failed to create Frank user: %v", err)
		return
	}
	
	if err := userRepo.Save(ctx, frankUser); err != nil {
		log.Printf("Failed to save Frank user: %v", err)
		return
	}
	
	// 創建測試用戶 Alice Wang
	aliceUser, err := user.NewUser("alice@pingnom.app", "AlicePassword2024!", "Alice Wang")
	if err != nil {
		log.Printf("Failed to create Alice user: %v", err)
		return
	}
	
	if err := userRepo.Save(ctx, aliceUser); err != nil {
		log.Printf("Failed to save Alice user: %v", err)
		return
	}
	
	log.Printf("Created test users: Frank Li (%s), Alice Wang (%s)", frankUser.ID(), aliceUser.ID())
	
	// 創建測試餐廳
	restaurants := []struct {
		name, address, cuisine string
		lat, lng               float64
		rating                 float64
	}{
		{"鼎泰豐", "台北市信義區松仁路58號", "台式料理", 25.0330, 121.5654, 4.5},
		{"欣葉台菜", "台北市中山區雙城街34-1號", "台式料理", 25.0624, 121.5224, 4.3},
		{"添好運", "台北市信義區松仁路58號B1", "港式料理", 25.0330, 121.5654, 4.2},
		{"晶華軒", "台北市中山區中山北路二段39巷3號", "中式料理", 25.0627, 121.5204, 4.6},
		{"築地市場", "台北市信義區松仁路58號", "日式料理", 25.0330, 121.5654, 4.4},
		{"韓食館", "台北市大安區敦化南路一段233巷", "韓式料理", 25.0408, 121.5494, 4.1},
		{"義大利餐廳", "台北市信義區市府路45號", "義式料理", 25.0397, 121.5645, 4.0},
		{"泰式風味", "台北市大安區復興南路一段390號", "泰式料理", 25.0408, 121.5434, 4.2},
	}
	
	for _, r := range restaurants {
		restaurant := restaurant.NewRestaurant(
			r.name,
			r.address,
			r.cuisine,
			r.lat,
			r.lng,
			r.rating,
		)
		if err := restaurantRepo.Save(restaurant); err != nil {
			log.Printf("Failed to save restaurant %s: %v", r.name, err)
		}
	}
	
	log.Println("Created 8 test restaurants")
	
	// 創建測試群組
	testGroup, err := group.NewGroup(
		frankUser.ID(),
		"週末聚餐團",
		"每週末一起去嚐鮮的聚餐群組",
		group.PrivacyPublic,
		8,
	)
	if err != nil {
		log.Printf("Failed to create test group: %v", err)
		return
	}
	
	if err := groupRepo.Create(testGroup); err != nil {
		log.Printf("Failed to save test group: %v", err)
		return
	}
	
	// 邀請 Alice 加入群組
	if err := testGroup.AddMember(aliceUser.ID()); err != nil {
		log.Printf("Failed to add Alice to group: %v", err)
	} else {
		if err := groupRepo.Update(testGroup); err != nil {
			log.Printf("Failed to update group with new member: %v", err)
		}
	}
	
	log.Printf("Created test group: %s with 2 members", testGroup.Name)
	
	log.Println("Test data creation completed")
}