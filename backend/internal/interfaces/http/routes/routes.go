package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/handlers"
	"github.com/chun-wei0413/pingnom/internal/interfaces/http/middleware"
)

type Router struct {
	userHandler *handlers.UserHandler
	authMiddleware *middleware.AuthMiddleware
}

func NewRouter(userHandler *handlers.UserHandler, authMiddleware *middleware.AuthMiddleware) *Router {
	return &Router{
		userHandler: userHandler,
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
	}
}