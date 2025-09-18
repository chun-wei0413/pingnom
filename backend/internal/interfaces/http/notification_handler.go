package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	notificationApp "github.com/chun-wei0413/pingnom/internal/application/notification"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
)

// NotificationHandler 通知 HTTP 處理器
type NotificationHandler struct {
	service *notificationApp.Service
}

// NewNotificationHandler 創建新的通知處理器
func NewNotificationHandler(service *notificationApp.Service) *NotificationHandler {
	return &NotificationHandler{
		service: service,
	}
}

// GetNotifications 獲取用戶通知
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}

	// 解析查詢參數
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	unreadOnly := c.Query("unread_only") == "true"

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var notifications []*notification.Notification

	if unreadOnly {
		notifications, err = h.service.GetUnreadNotifications(c.Request.Context(), userID, limit, offset)
	} else {
		notifications, err = h.service.GetUserNotifications(c.Request.Context(), userID, limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "取得通知失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"limit":         limit,
		"offset":        offset,
		"unread_only":   unreadOnly,
	})
}

// GetUnreadCount 獲取未讀通知數量
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}

	count, err := h.service.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "取得未讀數量失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"unread_count": count,
	})
}

// MarkAsRead 標記通知為已讀
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}

	notificationIDStr := c.Param("id")
	notificationID, err := uuid.Parse(notificationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的通知 ID"})
		return
	}

	// 驗證通知是否屬於當前用戶
	notif, err := h.service.GetUserNotifications(c.Request.Context(), userID, 1000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "驗證通知失敗"})
		return
	}

	found := false
	for _, n := range notif {
		if n.ID == notificationID {
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "通知不存在"})
		return
	}

	err = h.service.MarkAsRead(c.Request.Context(), notificationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "標記已讀失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "已標記為已讀",
		"notification_id": notificationIDStr,
	})
}

// MarkAllAsRead 標記所有通知為已讀
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}

	err = h.service.MarkAllAsRead(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "標記所有已讀失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "已標記所有通知為已讀",
	})
}

// CreateNotificationRequest 創建通知請求
type CreateNotificationRequest struct {
	ReceiverID uuid.UUID              `json:"receiver_id" binding:"required"`
	Type       notification.NotificationType `json:"type" binding:"required"`
	Title      string                 `json:"title" binding:"required"`
	Message    string                 `json:"message" binding:"required"`
	Data       map[string]any         `json:"data,omitempty"`
}

// CreateNotification 創建通知（管理用或系統用）
func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求格式錯誤"})
		return
	}

	// 獲取發送者 ID（可選）
	var senderID *uuid.UUID
	if userIDStr, exists := c.Get("user_id"); exists {
		if userID, err := uuid.Parse(userIDStr.(string)); err == nil {
			senderID = &userID
		}
	}

	err := h.service.CreateNotification(
		c.Request.Context(),
		req.ReceiverID,
		req.Type,
		req.Title,
		req.Message,
		req.Data,
		senderID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "創建通知失敗"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "通知創建成功",
	})
}

// BroadcastSystemNotificationRequest 廣播系統通知請求
type BroadcastSystemNotificationRequest struct {
	Title   string         `json:"title" binding:"required"`
	Message string         `json:"message" binding:"required"`
	Data    map[string]any `json:"data,omitempty"`
}

// BroadcastSystemNotification 廣播系統通知（管理用）
func (h *NotificationHandler) BroadcastSystemNotification(c *gin.Context) {
	var req BroadcastSystemNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求格式錯誤"})
		return
	}

	err := h.service.BroadcastSystemNotification(
		c.Request.Context(),
		req.Title,
		req.Message,
		req.Data,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "廣播通知失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "系統通知廣播成功",
	})
}

// TestNotification 測試通知（開發用）
func (h *NotificationHandler) TestNotification(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}

	// 創建測試通知
	err = h.service.CreateNotification(
		c.Request.Context(),
		userID,
		notification.NotificationTypeSystem,
		"測試通知",
		"這是一個測試通知，確認通知系統正常運作",
		map[string]any{
			"test": true,
			"timestamp": "測試時間",
		},
		nil,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "創建測試通知失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "測試通知已發送",
	})
}