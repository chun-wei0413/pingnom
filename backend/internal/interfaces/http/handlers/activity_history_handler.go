package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	activitycommands "github.com/chun-wei0413/pingnom/internal/application/commands/activity"
	activityqueries "github.com/chun-wei0413/pingnom/internal/application/queries/activity"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

type ActivityHistoryHandler struct {
	createActivityHistoryHandler *activitycommands.CreateActivityHistoryHandler
	updateActivityHistoryHandler *activitycommands.UpdateActivityHistoryHandler
	getUserActivityHistoryHandler *activityqueries.GetUserActivityHistoryHandler
}

func NewActivityHistoryHandler(
	createActivityHistoryHandler *activitycommands.CreateActivityHistoryHandler,
	updateActivityHistoryHandler *activitycommands.UpdateActivityHistoryHandler,
	getUserActivityHistoryHandler *activityqueries.GetUserActivityHistoryHandler,
) *ActivityHistoryHandler {
	return &ActivityHistoryHandler{
		createActivityHistoryHandler:  createActivityHistoryHandler,
		updateActivityHistoryHandler:  updateActivityHistoryHandler,
		getUserActivityHistoryHandler: getUserActivityHistoryHandler,
	}
}

// POST /api/v1/activities
func (h *ActivityHistoryHandler) CreateActivityHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		GroupDiningID  string `json:"groupDiningId" validate:"required"`
		RestaurantID   string `json:"restaurantId" validate:"required"`
		RestaurantName string `json:"restaurantName" validate:"required"`
		AttendedAt     string `json:"attendedAt" validate:"required"` // ISO format
		Participants   int    `json:"participants" validate:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Parse user ID
	parsedUserID, err := shared.ParseUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	// Parse attended time
	attendedAt, err := time.Parse(time.RFC3339, request.AttendedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid attendedAt format",
			"details": "Please use ISO 8601 format (e.g., 2023-12-25T18:00:00Z)",
		})
		return
	}

	// Create command
	cmd := activitycommands.CreateActivityHistoryCommand{
		UserID:         parsedUserID,
		GroupDiningID:  request.GroupDiningID,
		RestaurantID:   request.RestaurantID,
		RestaurantName: request.RestaurantName,
		AttendedAt:     attendedAt,
		Participants:   request.Participants,
	}

	// Execute command
	result, err := h.createActivityHistoryHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to create activity history",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Activity history created successfully",
	})
}

// PUT /api/v1/activities/:id
func (h *ActivityHistoryHandler) UpdateActivityHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	activityID := c.Param("id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Activity ID is required"})
		return
	}

	var request struct {
		Status       string `json:"status" validate:"oneof=pending completed cancelled"`
		Participants int    `json:"participants" validate:"min=1"`
		Notes        string `json:"notes" validate:"max=500"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Parse user ID
	parsedUserID, err := shared.ParseUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	// Parse activity ID
	parsedActivityID, err := activity.NewActivityHistoryIDFromString(activityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid activity ID format",
			"details": err.Error(),
		})
		return
	}

	// Parse status if provided
	var activityStatus activity.ActivityStatus
	if request.Status != "" {
		switch request.Status {
		case "pending":
			activityStatus = activity.ActivityStatusPending
		case "completed":
			activityStatus = activity.ActivityStatusCompleted
		case "cancelled":
			activityStatus = activity.ActivityStatusCancelled
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid status. Must be one of: pending, completed, cancelled",
			})
			return
		}
	}

	// Create command
	cmd := activitycommands.UpdateActivityHistoryCommand{
		ID:           parsedActivityID,
		UserID:       parsedUserID,
		Status:       activityStatus,
		Participants: request.Participants,
		Notes:        request.Notes,
	}

	// Execute command
	_, err = h.updateActivityHistoryHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to update activity history",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Activity history updated successfully",
	})
}

// GET /api/v1/activities
func (h *ActivityHistoryHandler) GetUserActivityHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Parse user ID
	parsedUserID, err := shared.ParseUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	// Parse status filter if provided
	var activityStatus activity.ActivityStatus
	if status != "" {
		switch status {
		case "pending":
			activityStatus = activity.ActivityStatusPending
		case "completed":
			activityStatus = activity.ActivityStatusCompleted
		case "cancelled":
			activityStatus = activity.ActivityStatusCancelled
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid status. Must be one of: pending, completed, cancelled",
			})
			return
		}
	}

	// Create query
	query := activityqueries.GetUserActivityHistoryQuery{
		UserID: parsedUserID,
		Status: activityStatus,
		Limit:  limit,
		Offset: offset,
	}

	// Execute query
	activities, err := h.getUserActivityHistoryHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user activity history",
			"details": err.Error(),
		})
		return
	}

	// Convert to response format
	response := make([]map[string]interface{}, len(activities))
	for i, activity := range activities {
		response[i] = map[string]interface{}{
			"id":              activity.ID().String(),
			"groupDiningId":   activity.GroupDiningID(),
			"restaurantId":    activity.RestaurantID(),
			"restaurantName":  activity.RestaurantName(),
			"attendedAt":      activity.AttendedAt().Format("2006-01-02T15:04:05Z07:00"),
			"status":          activity.Status().String(),
			"participants":    activity.Participants(),
			"notes":           activity.Notes(),
			"createdAt":       activity.CreatedAt().Format("2006-01-02T15:04:05Z07:00"),
			"updatedAt":       activity.UpdatedAt().Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"activities": response,
			"total":      len(response),
		},
	})
}