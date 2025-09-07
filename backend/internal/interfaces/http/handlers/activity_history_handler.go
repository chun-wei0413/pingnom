package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	activitycommands "github.com/chun-wei0413/pingnom/internal/application/commands/activity"
	activityQueries "github.com/chun-wei0413/pingnom/internal/application/queries/activity"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	activityDomain "github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// ActivityHistoryHandler handles HTTP requests for activity history
type ActivityHistoryHandler struct {
	createHandler    *activitycommands.CreateActivityHistoryHandler
	updateHandler    *activitycommands.UpdateActivityHistoryHandler
	getUserHistoryHandler *activityQueries.GetUserActivityHistoryHandler
}

// NewActivityHistoryHandler creates a new activity history handler
func NewActivityHistoryHandler(
	createHandler *activitycommands.CreateActivityHistoryHandler,
	updateHandler *activitycommands.UpdateActivityHistoryHandler,
	getUserHistoryHandler *activityQueries.GetUserActivityHistoryHandler,
) *ActivityHistoryHandler {
	return &ActivityHistoryHandler{
		createHandler:    createHandler,
		updateHandler:    updateHandler,
		getUserHistoryHandler: getUserHistoryHandler,
	}
}

// CreateActivityHistoryRequest represents the request for creating activity history
type CreateActivityHistoryRequest struct {
	GroupDiningID  string `json:"group_dining_id" binding:"required"`
	RestaurantID   string `json:"restaurant_id" binding:"required"`
	RestaurantName string `json:"restaurant_name" binding:"required"`
	AttendedAt     string `json:"attended_at" binding:"required"`
	Participants   int    `json:"participants" binding:"required,min=1"`
}

// UpdateActivityHistoryRequest represents the request for updating activity history
type UpdateActivityHistoryRequest struct {
	Status       string `json:"status,omitempty"`
	Notes        string `json:"notes,omitempty"`
	Participants int    `json:"participants,omitempty"`
}

// CreateActivityHistory handles creating a new activity history
func (h *ActivityHistoryHandler) CreateActivityHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateActivityHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse attended date
	attendedAt, err := parseTime(req.AttendedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attended_at format. Use RFC3339 format"})
		return
	}

	cmd := activity.CreateActivityHistoryCommand{
		UserID:         shared.UserID(userID.(string)),
		GroupDiningID:  req.GroupDiningID,
		RestaurantID:   req.RestaurantID,
		RestaurantName: req.RestaurantName,
		AttendedAt:     attendedAt,
		Participants:   req.Participants,
	}

	result, err := h.createHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, formatActivityHistoryResponse(result))
}

// UpdateActivityHistory handles updating an existing activity history
func (h *ActivityHistoryHandler) UpdateActivityHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	activityID := c.Param("id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Activity ID is required"})
		return
	}

	var req UpdateActivityHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse activity ID
	id, err := activityDomain.ParseActivityHistoryID(activityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid activity ID"})
		return
	}

	// Parse status if provided
	var status activityDomain.ActivityStatus
	if req.Status != "" {
		switch req.Status {
		case "completed":
			status = activityDomain.ActivityStatusCompleted
		case "cancelled":
			status = activityDomain.ActivityStatusCancelled
		case "pending":
			status = activityDomain.ActivityStatusPending
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Use: pending, completed, cancelled"})
			return
		}
	}

	cmd := activity.UpdateActivityHistoryCommand{
		ID:           id,
		UserID:       shared.UserID(userID.(string)),
		Status:       status,
		Notes:        req.Notes,
		Participants: req.Participants,
	}

	result, err := h.updateHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		if err == shared.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this activity"})
			return
		}
		if err == shared.ErrActivityHistoryNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Activity history not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, formatActivityHistoryResponse(result))
}

// GetUserActivityHistory handles retrieving user's activity history
func (h *ActivityHistoryHandler) GetUserActivityHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	statusFilter := c.Query("status")

	var status activityDomain.ActivityStatus
	if statusFilter != "" {
		switch statusFilter {
		case "completed":
			status = activityDomain.ActivityStatusCompleted
		case "cancelled":
			status = activityDomain.ActivityStatusCancelled
		case "pending":
			status = activityDomain.ActivityStatusPending
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status filter. Use: pending, completed, cancelled"})
			return
		}
	}

	query := activityQueries.GetUserActivityHistoryQuery{
		UserID: shared.UserID(userID.(string)),
		Status: status,
		Limit:  limit,
		Offset: offset,
	}

	activities, err := h.getUserHistoryHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]gin.H, len(activities))
	for i, activity := range activities {
		response[i] = formatActivityHistoryResponse(activity)
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": response,
		"limit":      limit,
		"offset":     offset,
	})
}

// Helper function to parse time from string
func parseTime(timeStr string) (time.Time, error) {
	// Try RFC3339 format first
	if t, err := time.Parse(time.RFC3339, timeStr); err == nil {
		return t, nil
	}
	// Try other common formats
	if t, err := time.Parse("2006-01-02T15:04:05Z07:00", timeStr); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02 15:04:05", timeStr); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", timeStr); err == nil {
		return t, nil
	}
	return time.Time{}, time.ErrBadData
}

// Helper function to format activity history response
func formatActivityHistoryResponse(activity *activityDomain.ActivityHistory) gin.H {
	return gin.H{
		"id":              activity.ID().String(),
		"user_id":         string(activity.UserID()),
		"group_dining_id": activity.GroupDiningID(),
		"restaurant_id":   activity.RestaurantID(),
		"restaurant_name": activity.RestaurantName(),
		"attended_at":     activity.AttendedAt().Format("2006-01-02T15:04:05Z07:00"),
		"status":          string(activity.Status()),
		"participants":    activity.Participants(),
		"notes":           activity.Notes(),
		"created_at":      activity.CreatedAt().Format("2006-01-02T15:04:05Z07:00"),
		"updated_at":      activity.UpdatedAt().Format("2006-01-02T15:04:05Z07:00"),
	}
}