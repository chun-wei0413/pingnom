package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
)

type Router struct {
	userHandler *handlers.UserHandler
	authHandler *handlers.AuthHandler
	friendshipHandler *handlers.FriendshipHandler
	pingHandler *handlers.PingHandler
	restaurantHandler *handlers.RestaurantHandler
	authMiddleware *middleware.AuthMiddleware
}

func NewRouter(userHandler *handlers.UserHandler, authHandler *handlers.AuthHandler, friendshipHandler *handlers.FriendshipHandler, pingHandler *handlers.PingHandler, restaurantHandler *handlers.RestaurantHandler, authMiddleware *middleware.AuthMiddleware) *Router {
	return &Router{
		userHandler: userHandler,
		authHandler: authHandler,
		friendshipHandler: friendshipHandler,
		pingHandler: pingHandler,
		restaurantHandler: restaurantHandler,
		authMiddleware: authMiddleware,
	}
}

func (r *Router) SetupRoutes(engine *gin.Engine) {
	// Health check
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"service": "pingnom-api",
		})
	})
	
	// API v1 routes
	v1 := engine.Group("/api/v1")
	
	// Public routes (no authentication required)
	public := v1.Group("/")
	{
		// Authentication
		public.POST("/auth/login", r.authHandler.Login)
		
		// User registration
		public.POST("/users/register", r.userHandler.Register)
		
		// User search (public for discovering friends)
		public.GET("/users/search", r.userHandler.SearchUsers)
	}
	
	// Protected routes (authentication required)
	protected := v1.Group("/")
	protected.Use(r.authMiddleware.RequireAuth())
	{
		// User profile management
		protected.GET("/users/profile", r.userHandler.GetProfile)
		protected.PUT("/users/profile", r.userHandler.UpdateProfile)
		protected.PUT("/users/password", r.userHandler.ChangePassword)
		
		// User preferences and privacy
		protected.PUT("/users/preferences", r.userHandler.UpdatePreferences)
		protected.PUT("/users/privacy", r.userHandler.UpdatePrivacy)
		
		// Friendship routes
		friends := protected.Group("/friends")
		{
			// Send friend request
			friends.POST("/request", r.friendshipHandler.SendFriendRequest)
			
			// Accept friend request
			friends.PUT("/request/:id/accept", r.friendshipHandler.AcceptFriendRequest)
			
			// Decline friend request
			friends.PUT("/request/:id/decline", r.friendshipHandler.DeclineFriendRequest)
			
			// Block user
			friends.POST("/block", r.friendshipHandler.BlockUser)
			
			// Remove friend
			friends.DELETE("/:friendId", r.friendshipHandler.RemoveFriend)
			
			// Get friends list
			friends.GET("/", r.friendshipHandler.GetFriends)
			
			// Get pending friend requests (received)
			friends.GET("/requests/pending", r.friendshipHandler.GetPendingRequests)
			
			// Get sent friend requests
			friends.GET("/requests/sent", r.friendshipHandler.GetSentRequests)
		}
		
		// Ping routes
		pings := protected.Group("/pings")
		{
			// Create new ping
			pings.POST("/", r.pingHandler.CreatePing)
			
			// Get user's pings
			pings.GET("/", r.pingHandler.GetUserPings)
			
			// Respond to ping
			pings.PUT("/:id/respond", r.pingHandler.RespondToPing)
		}
		
		// Restaurant routes
		restaurants := protected.Group("/restaurants")
		{
			// Search restaurants
			restaurants.GET("/", r.restaurantHandler.SearchRestaurants)
			
			// Get restaurant recommendations
			restaurants.POST("/recommendations", r.restaurantHandler.GetRecommendations)
			
			// Get restaurant by ID
			restaurants.GET("/:id", r.restaurantHandler.GetRestaurantByID)
		}
	}
}