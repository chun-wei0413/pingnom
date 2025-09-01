package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	pingcommands "github.com/chun-wei0413/pingnom/internal/application/commands/ping"
	pingqueries "github.com/chun-wei0413/pingnom/internal/application/queries/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
)

type PingHandler struct {
	createPingHandler      *pingcommands.CreatePingHandler
	respondToPingHandler   *pingcommands.RespondToPingHandler
	getUserPingsHandler    *pingqueries.GetUserPingsHandler
}

func NewPingHandler(
	createPingHandler *pingcommands.CreatePingHandler,
	respondToPingHandler *pingcommands.RespondToPingHandler,
	getUserPingsHandler *pingqueries.GetUserPingsHandler,
) *PingHandler {
	return &PingHandler{
		createPingHandler:      createPingHandler,
		respondToPingHandler:   respondToPingHandler,
		getUserPingsHandler:    getUserPingsHandler,
	}
}

// POST /api/v1/pings
func (h *PingHandler) CreatePing(c *gin.Context) {
	// Get current user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Parse request body
	var request struct {
		Title       string    `json:"title" validate:"required,min=1,max=100"`
		Description string    `json:"description" validate:"max=500"`
		PingType    string    `json:"pingType" validate:"required,oneof=breakfast lunch dinner snack"`
		ScheduledAt string    `json:"scheduledAt" validate:"required"` // ISO format
		Invitees    []string  `json:"invitees" validate:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Parse scheduled time
	scheduledAt, err := time.Parse(time.RFC3339, request.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid scheduledAt format",
			"details": "Please use ISO 8601 format (e.g., 2023-12-25T18:00:00Z)",
		})
		return
	}

	// Convert invitees to UserIDs
	inviteeIDs := make([]shared.UserID, len(request.Invitees))
	for i, inviteeStr := range request.Invitees {
		inviteeID, err := shared.ParseUserID(inviteeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid invitee ID format",
				"details": err.Error(),
			})
			return
		}
		inviteeIDs[i] = inviteeID
	}

	// Create command
	userIDStr := userID.(string)
	createdBy, err := shared.ParseUserID(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	cmd := pingcommands.CreatePingCommand{
		CreatedBy:   createdBy,
		Title:       request.Title,
		Description: request.Description,
		PingType:    ping.PingType(request.PingType),
		ScheduledAt: scheduledAt,
		Invitees:    inviteeIDs,
	}

	// Execute command
	result, err := h.createPingHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Ping created successfully",
	})
}

// PUT /api/v1/pings/:id/respond
func (h *PingHandler) RespondToPing(c *gin.Context) {
	// Get current user from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Get ping ID from URL
	pingIDStr := c.Param("id")
	pingID, err := shared.ParseID(pingIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid ping ID",
			"details": err.Error(),
		})
		return
	}

	// Parse request body
	var request struct {
		Status  string `json:"status" validate:"required,oneof=accepted declined"`
		Message string `json:"message" validate:"max=200"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Create command
	userIDStr := userID.(string)
	respondingUserID, err := shared.ParseUserID(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	cmd := pingcommands.RespondToPingCommand{
		PingID:  pingID,
		UserID:  respondingUserID,
		Status:  ping.ResponseStatus(request.Status),
		Message: request.Message,
	}

	// Execute command
	result, err := h.respondToPingHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Response recorded successfully",
	})
}

// GET /api/v1/pings
func (h *PingHandler) GetUserPings(c *gin.Context) {
	// Get current user from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Parse query parameters
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

	// Create query
	userIDStr := userID.(string)
	queryUserID, err := shared.ParseUserID(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"details": err.Error(),
		})
		return
	}

	query := pingqueries.GetUserPingsQuery{
		UserID: queryUserID,
		Limit:  limit,
		Offset: offset,
	}

	// Execute query
	result, err := h.getUserPingsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}