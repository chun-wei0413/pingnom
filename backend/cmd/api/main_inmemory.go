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
	restaurantqueries "github.com/chun-wei0413/pingnom/internal/application/queries/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
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
	
	// Group Dining repositories
	groupDiningPlanRepo := groupdiningrepos.NewGroupDiningPlanRepositoryInMemory()
	voteRepo := groupdiningrepos.NewVoteRepositoryInMemory()
	
	// 依賴注入 - 建立 Domain Services
	userService := user.NewUserService(userRepo)
	friendshipService := friendship.NewFriendshipService(friendshipRepo)
	pingService := ping.NewService(pingRepo)
	restaurantRecommendationService := restaurant.NewRecommendationService(restaurantRepo)
	
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
	router := routes.NewRouter(userHandler, authHandler, friendshipHandler, pingHandler, restaurantHandler, statisticsHandler, dashboardHandler, authMiddleware)
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
	createTestRestaurants(restaurantRepo)

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

// createTestRestaurants 創建測試餐廳資料
func createTestRestaurants(restaurantRepo restaurant.Repository) {
	ctx := context.Background()
	
	// 台北市中心區域的測試餐廳
	testRestaurants := []*restaurant.Restaurant{}
	
	// 1. 鼎泰豐 (信義店) - 台北市信義區
	dingTaiFeng, _ := restaurant.NewRestaurant(
		"鼎泰豐 (信義店)",
		"著名的小籠包餐廳，提供精緻的台式點心與料理",
		restaurant.Location{
			Latitude:  25.0330,
			Longitude: 121.5654,
			Address:   "台北市信義區松仁路58號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeTaiwanese, restaurant.CuisineTypeChinese},
		restaurant.PriceLevelExpensive,
		"+886-2-8101-7799",
	)
	dingTaiFeng.Rating = 4.3
	dingTaiFeng.TotalReviews = 2856
	dingTaiFeng.AcceptsReservations = true
	dingTaiFeng.AverageWaitTime = 30
	dingTaiFeng.SupportedRestrictions = []restaurant.DietaryRestriction{restaurant.DietaryRestrictionVegetarian}
	testRestaurants = append(testRestaurants, dingTaiFeng)
	
	// 2. 欣葉日本料理 - 台北市中山區
	xinYe, _ := restaurant.NewRestaurant(
		"欣葉日本料理",
		"老字號日本料理餐廳，提供新鮮壽司與日式料理",
		restaurant.Location{
			Latitude:  25.0478,
			Longitude: 121.5319,
			Address:   "台北市中山區南京東路二段206號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeJapanese},
		restaurant.PriceLevelExpensive,
		"+886-2-2507-3255",
	)
	xinYe.Rating = 4.1
	xinYe.TotalReviews = 1923
	xinYe.AcceptsReservations = true
	xinYe.AverageWaitTime = 25
	testRestaurants = append(testRestaurants, xinYe)
	
	// 3. 大三元酒樓 - 台北市大同區
	daSanYuan, _ := restaurant.NewRestaurant(
		"大三元酒樓",
		"傳統粤菜茶餐廳，提供港式點心與粤菜料理",
		restaurant.Location{
			Latitude:  25.0453,
			Longitude: 121.5097,
			Address:   "台北市大同區民生西路136號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeChinese},
		restaurant.PriceLevelMidRange,
		"+886-2-2558-9295",
	)
	daSanYuan.Rating = 3.9
	daSanYuan.TotalReviews = 1456
	daSanYuan.AcceptsReservations = true
	daSanYuan.AverageWaitTime = 20
	testRestaurants = append(testRestaurants, daSanYuan)
	
	// 4. 春川炸雞 - 台北市中正區
	chunChuan, _ := restaurant.NewRestaurant(
		"春川炸雞 (台北車站店)",
		"韓式炸雞專門店，提供多種口味的韓式炸雞",
		restaurant.Location{
			Latitude:  25.0478,
			Longitude: 121.5170,
			Address:   "台北市中正區館前路8號B1",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeKorean},
		restaurant.PriceLevelMidRange,
		"+886-2-2389-1391",
	)
	chunChuan.Rating = 4.2
	chunChuan.TotalReviews = 2134
	chunChuan.AcceptsReservations = false
	chunChuan.AverageWaitTime = 15
	testRestaurants = append(testRestaurants, chunChuan)
	
	// 5. MOMO Paradise - 台北市信義區
	momoPara, _ := restaurant.NewRestaurant(
		"MOMO Paradise (信義店)",
		"日式涮涮鍋吃到飽餐廳，提供優質肉品與海鮮",
		restaurant.Location{
			Latitude:  25.0360,
			Longitude: 121.5645,
			Address:   "台北市信義區松高路19號4樓",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeJapanese, restaurant.CuisineTypeHotpot},
		restaurant.PriceLevelExpensive,
		"+886-2-2722-0062",
	)
	momoPara.Rating = 4.0
	momoPara.TotalReviews = 1687
	momoPara.AcceptsReservations = true
	momoPara.AverageWaitTime = 35
	testRestaurants = append(testRestaurants, momoPara)
	
	// 6. 寬巷子鍋物 - 台北市大安區
	kuanXiangZi, _ := restaurant.NewRestaurant(
		"寬巷子鍋物",
		"精緻火鍋餐廳，提供高品質食材與獨特湯頭",
		restaurant.Location{
			Latitude:  25.0417,
			Longitude: 121.5436,
			Address:   "台北市大安區敦化南路一段161巷18號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeHotpot, restaurant.CuisineTypeTaiwanese},
		restaurant.PriceLevelVeryExpensive,
		"+886-2-2741-5353",
	)
	kuanXiangZi.Rating = 4.4
	kuanXiangZi.TotalReviews = 934
	kuanXiangZi.AcceptsReservations = true
	kuanXiangZi.AverageWaitTime = 40
	testRestaurants = append(testRestaurants, kuanXiangZi)
	
	// 7. 素食者天堂 - 台北市松山區
	vegParadise, _ := restaurant.NewRestaurant(
		"素食者天堂",
		"創意素食餐廳，提供健康美味的素食料理",
		restaurant.Location{
			Latitude:  25.0497,
			Longitude: 121.5746,
			Address:   "台北市松山區南京東路四段133號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeVegetarian, restaurant.CuisineTypeTaiwanese},
		restaurant.PriceLevelMidRange,
		"+886-2-2718-8866",
	)
	vegParadise.Rating = 4.3
	vegParadise.TotalReviews = 678
	vegParadise.AcceptsReservations = true
	vegParadise.AverageWaitTime = 10
	vegParadise.SupportedRestrictions = []restaurant.DietaryRestriction{
		restaurant.DietaryRestrictionVegetarian, 
		restaurant.DietaryRestrictionVegan,
	}
	testRestaurants = append(testRestaurants, vegParadise)
	
	// 8. 阿宗麵線 - 台北市萬華區
	aZongNoodles, _ := restaurant.NewRestaurant(
		"阿宗麵線 (西門店)",
		"台北知名小吃，傳統大腸麵線專賣店",
		restaurant.Location{
			Latitude:  25.0421,
			Longitude: 121.5064,
			Address:   "台北市萬華區峨嵋街8-1號",
		},
		[]restaurant.CuisineType{restaurant.CuisineTypeTaiwanese},
		restaurant.PriceLevelBudget,
		"+886-2-2388-8808",
	)
	aZongNoodles.Rating = 3.8
	aZongNoodles.TotalReviews = 5623
	aZongNoodles.AcceptsReservations = false
	aZongNoodles.AverageWaitTime = 5
	testRestaurants = append(testRestaurants, aZongNoodles)
	
	// 將測試餐廳資料存入 repository
	successCount := 0
	for _, rest := range testRestaurants {
		if err := restaurantRepo.Create(ctx, rest); err != nil {
			log.Printf("⚠️  Failed to create test restaurant %s: %v", rest.Name, err)
		} else {
			successCount++
		}
	}
	
	log.Printf("✅ Created %d test restaurants in Taipei area", successCount)
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

