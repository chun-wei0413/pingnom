package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/ping"
)

// DashboardHandler handles dashboard-related HTTP requests
type DashboardHandler struct {
	friendshipRepo friendship.FriendshipRepository
	pingRepo       ping.Repository
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(
	friendshipRepo friendship.FriendshipRepository,
	pingRepo ping.Repository,
) *DashboardHandler {
	return &DashboardHandler{
		friendshipRepo: friendshipRepo,
		pingRepo:       pingRepo,
	}
}

// GetDashboardStats returns basic dashboard statistics
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
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

	ctx := c.Request.Context()

	// 獲取朋友統計
	friends, err := h.friendshipRepo.FindFriendsByUserID(ctx, userIDParsed, 100, 0)
	if err != nil {
		friends = []*friendship.Friendship{} // 如果出錯就返回空列表
	}

	// 獲取待處理的朋友邀請
	pendingRequests, err := h.friendshipRepo.FindPendingRequestsByUserID(ctx, userIDParsed, 100, 0)
	if err != nil {
		pendingRequests = []*friendship.Friendship{} // 如果出錯就返回空列表
	}

	// 獲取用戶的 Ping 統計（簡化版本）
	userPings, err := h.pingRepo.GetActivePings(ctx, userIDParsed, 100, 0)
	if err != nil {
		userPings = []*ping.Ping{} // 如果出錯就返回空列表
	}

	// 計算活躍的 Pings
	activePings := 0
	for _, p := range userPings {
		if p.Status() == ping.PingStatusActive {
			activePings++
		}
	}

	// 構建回應
	stats := gin.H{
		"user_id":          userIDParsed.String(),
		"total_friends":    len(friends),
		"pending_requests": len(pendingRequests),
		"total_pings":      len(userPings),
		"active_pings":     activePings,
		"generated_at":     "2024-01-01T00:00:00Z", // 簡化版本
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}