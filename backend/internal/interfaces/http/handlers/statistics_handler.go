package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/application/queries/statistics"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	statisticsDomain "github.com/chun-wei0413/pingnom/internal/domain/statistics"
)

// StatisticsHandler handles HTTP requests for user statistics
type StatisticsHandler struct {
	getUserStatisticsHandler *statistics.GetUserStatisticsHandler
}

// NewStatisticsHandler creates a new statistics handler
func NewStatisticsHandler(
	getUserStatisticsHandler *statistics.GetUserStatisticsHandler,
) *StatisticsHandler {
	return &StatisticsHandler{
		getUserStatisticsHandler: getUserStatisticsHandler,
	}
}

// GetUserStatistics handles retrieving comprehensive user statistics
func (h *StatisticsHandler) GetUserStatistics(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDParsed, err := shared.NewUserIDFromString(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	query := statistics.GetUserStatisticsQuery{
		UserID: userIDParsed,
	}

	stats, err := h.getUserStatisticsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, formatUserStatisticsResponse(stats))
}

// Helper function to format user statistics response
func formatUserStatisticsResponse(stats *statisticsDomain.UserStatistics) gin.H {
	// Format favorite restaurants
	favoriteRestaurants := make([]gin.H, len(stats.FavoriteRestaurants()))
	for i, restaurant := range stats.FavoriteRestaurants() {
		favoriteRestaurants[i] = gin.H{
			"restaurant_id":   restaurant.RestaurantID,
			"restaurant_name": restaurant.RestaurantName,
			"visit_count":     restaurant.VisitCount,
			"average_rating":  restaurant.AverageRating,
			"last_visited":    restaurant.LastVisited.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	// Format monthly statistics
	monthlyStats := make([]gin.H, len(stats.MonthlyStats()))
	for i, month := range stats.MonthlyStats() {
		monthlyStats[i] = gin.H{
			"year":       month.Year,
			"month":      month.Month,
			"activities": month.Activities,
			"reviews":    month.Reviews,
		}
	}

	// Format top restaurant
	var topRestaurant gin.H
	if topRest := stats.GetTopRestaurant(); topRest != nil {
		topRestaurant = gin.H{
			"restaurant_id":   topRest.RestaurantID,
			"restaurant_name": topRest.RestaurantName,
			"visit_count":     topRest.VisitCount,
			"average_rating":  topRest.AverageRating,
			"last_visited":    topRest.LastVisited.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	response := gin.H{
		"user_id":                stats.UserID().String(),
		"total_activities":       stats.TotalActivities(),
		"completed_activities":   stats.CompletedActivities(),
		"cancelled_activities":   stats.CancelledActivities(),
		"total_reviews":          stats.TotalReviews(),
		"average_rating":         stats.AverageRating(),
		"completion_rate":        stats.GetCompletionRate(),
		"cancellation_rate":      stats.GetCancellationRate(),
		"review_rate":            stats.GetReviewRate(),
		"favorite_restaurants":   favoriteRestaurants,
		"monthly_stats":          monthlyStats,
		"top_restaurant":         topRestaurant,
		"most_active_month":      stats.MostActiveMonth().Format("2006-01-02T15:04:05Z07:00"),
		"first_activity_date":    stats.FirstActivityDate().Format("2006-01-02T15:04:05Z07:00"),
		"last_activity_date":     stats.LastActivityDate().Format("2006-01-02T15:04:05Z07:00"),
		"generated_at":           stats.GeneratedAt().Format("2006-01-02T15:04:05Z07:00"),
	}

	// Handle zero time values
	if stats.MostActiveMonth().IsZero() {
		response["most_active_month"] = nil
	}
	if stats.FirstActivityDate().IsZero() {
		response["first_activity_date"] = nil
	}
	if stats.LastActivityDate().IsZero() {
		response["last_activity_date"] = nil
	}

	return response
}