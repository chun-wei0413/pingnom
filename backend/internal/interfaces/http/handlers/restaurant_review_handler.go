package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/application/commands/review"
	"github.com/chun-wei0413/pingnom/internal/application/queries/review"
	reviewQueries "github.com/chun-wei0413/pingnom/internal/application/queries/review"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	reviewDomain "github.com/chun-wei0413/pingnom/internal/domain/review"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// RestaurantReviewHandler handles HTTP requests for restaurant reviews
type RestaurantReviewHandler struct {
	createHandler           *review.CreateRestaurantReviewHandler
	updateHandler           *review.UpdateRestaurantReviewHandler
	getRestaurantReviewsHandler *reviewQueries.GetRestaurantReviewsHandler
	getUserReviewsHandler   *reviewQueries.GetUserReviewsHandler
}

// NewRestaurantReviewHandler creates a new restaurant review handler
func NewRestaurantReviewHandler(
	createHandler *review.CreateRestaurantReviewHandler,
	updateHandler *review.UpdateRestaurantReviewHandler,
	getRestaurantReviewsHandler *reviewQueries.GetRestaurantReviewsHandler,
	getUserReviewsHandler *reviewQueries.GetUserReviewsHandler,
) *RestaurantReviewHandler {
	return &RestaurantReviewHandler{
		createHandler:           createHandler,
		updateHandler:           updateHandler,
		getRestaurantReviewsHandler: getRestaurantReviewsHandler,
		getUserReviewsHandler:   getUserReviewsHandler,
	}
}

// CreateRestaurantReviewRequest represents the request for creating a restaurant review
type CreateRestaurantReviewRequest struct {
	RestaurantID   string  `json:"restaurant_id" binding:"required"`
	ActivityID     string  `json:"activity_id" binding:"required"`
	Rating         float64 `json:"rating" binding:"required,min=1,max=5"`
	Comment        string  `json:"comment"`
	FoodQuality    float64 `json:"food_quality" binding:"required,min=1,max=5"`
	Service        float64 `json:"service" binding:"required,min=1,max=5"`
	Atmosphere     float64 `json:"atmosphere" binding:"required,min=1,max=5"`
	ValueForMoney  float64 `json:"value_for_money" binding:"required,min=1,max=5"`
}

// UpdateRestaurantReviewRequest represents the request for updating a restaurant review
type UpdateRestaurantReviewRequest struct {
	Rating         float64 `json:"rating" binding:"required,min=1,max=5"`
	Comment        string  `json:"comment"`
	FoodQuality    float64 `json:"food_quality" binding:"required,min=1,max=5"`
	Service        float64 `json:"service" binding:"required,min=1,max=5"`
	Atmosphere     float64 `json:"atmosphere" binding:"required,min=1,max=5"`
	ValueForMoney  float64 `json:"value_for_money" binding:"required,min=1,max=5"`
}

// CreateRestaurantReview handles creating a new restaurant review
func (h *RestaurantReviewHandler) CreateRestaurantReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateRestaurantReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse activity ID
	activityID, err := activity.ParseActivityHistoryID(req.ActivityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid activity ID"})
		return
	}

	cmd := review.CreateRestaurantReviewCommand{
		UserID:         shared.UserID(userID.(string)),
		RestaurantID:   req.RestaurantID,
		ActivityID:     activityID,
		Rating:         req.Rating,
		Comment:        req.Comment,
		FoodQuality:    req.FoodQuality,
		Service:        req.Service,
		Atmosphere:     req.Atmosphere,
		ValueForMoney:  req.ValueForMoney,
	}

	result, err := h.createHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		if err == shared.ErrReviewAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Review already exists for this activity"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, formatRestaurantReviewResponse(result))
}

// UpdateRestaurantReview handles updating an existing restaurant review
func (h *RestaurantReviewHandler) UpdateRestaurantReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	reviewID := c.Param("id")
	if reviewID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Review ID is required"})
		return
	}

	var req UpdateRestaurantReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse review ID
	id, err := reviewDomain.ParseReviewID(reviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	cmd := review.UpdateRestaurantReviewCommand{
		ID:             id,
		UserID:         shared.UserID(userID.(string)),
		Rating:         req.Rating,
		Comment:        req.Comment,
		FoodQuality:    req.FoodQuality,
		Service:        req.Service,
		Atmosphere:     req.Atmosphere,
		ValueForMoney:  req.ValueForMoney,
	}

	result, err := h.updateHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		if err == shared.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this review"})
			return
		}
		if err == shared.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, formatRestaurantReviewResponse(result))
}

// GetRestaurantReviews handles retrieving reviews for a restaurant
func (h *RestaurantReviewHandler) GetRestaurantReviews(c *gin.Context) {
	restaurantID := c.Param("restaurant_id")
	if restaurantID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Restaurant ID is required"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	userFilter := c.Query("user_id")

	var userID shared.UserID
	if userFilter != "" {
		userID = shared.UserID(userFilter)
	}

	query := reviewQueries.GetRestaurantReviewsQuery{
		RestaurantID: restaurantID,
		UserID:       userID,
		Limit:        limit,
		Offset:       offset,
	}

	reviews, err := h.getRestaurantReviewsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]gin.H, len(reviews))
	for i, review := range reviews {
		response[i] = formatRestaurantReviewResponse(review)
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": response,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetUserReviews handles retrieving reviews by a user
func (h *RestaurantReviewHandler) GetUserReviews(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := reviewQueries.GetUserReviewsQuery{
		UserID: shared.UserID(userID.(string)),
		Limit:  limit,
		Offset: offset,
	}

	reviews, err := h.getUserReviewsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]gin.H, len(reviews))
	for i, review := range reviews {
		response[i] = formatRestaurantReviewResponse(review)
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": response,
		"limit":   limit,
		"offset":  offset,
	})
}

// Helper function to format restaurant review response
func formatRestaurantReviewResponse(review *reviewDomain.RestaurantReview) gin.H {
	return gin.H{
		"id":               review.ID().String(),
		"user_id":          string(review.UserID()),
		"restaurant_id":    review.RestaurantID(),
		"activity_id":      review.ActivityID().String(),
		"rating":           review.Rating().Value(),
		"comment":          review.Comment(),
		"food_quality":     review.FoodQuality().Value(),
		"service":          review.Service().Value(),
		"atmosphere":       review.Atmosphere().Value(),
		"value_for_money":  review.ValueForMoney().Value(),
		"reviewed_at":      review.ReviewedAt().Format("2006-01-02T15:04:05Z07:00"),
		"updated_at":       review.UpdatedAt().Format("2006-01-02T15:04:05Z07:00"),
	}
}