package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
	notificationApp "github.com/chun-wei0413/pingnom/internal/application/notification"
)

// Handler WebSocket 處理器
type Handler struct {
	hub     *notification.Hub
	service *notificationApp.Service
	upgrader websocket.Upgrader
}

// NewHandler 創建新的 WebSocket 處理器
func NewHandler(hub *notification.Hub, service *notificationApp.Service) *Handler {
	return &Handler{
		hub:     hub,
		service: service,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// 在生產環境中應該檢查來源
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}
}

// HandleWebSocket 處理 WebSocket 連接
func (h *Handler) HandleWebSocket(c *gin.Context) {
	// 從 context 中獲取用戶 ID（應該由認證中間件設置）
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

	// 升級 HTTP 連接為 WebSocket
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	// 創建連接對象
	wsConn := &notification.Connection{
		ID:       uuid.New(),
		UserID:   userID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
		LastSeen: time.Now().Unix(),
	}

	// 註冊連接
	h.hub.RegisterConnection(wsConn)

	// 啟動 goroutines 處理讀寫
	go h.handleRead(wsConn)
	go h.handleWrite(wsConn)

	// 發送歡迎消息和未讀通知
	go h.sendWelcomeMessage(wsConn)
}

// handleRead 處理來自客戶端的消息
func (h *Handler) handleRead(conn *notification.Connection) {
	defer func() {
		h.hub.UnregisterConnection(conn)
		conn.Conn.Close()
	}()

	// 設置讀取參數
	conn.Conn.SetReadLimit(512)
	conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.Conn.SetPongHandler(func(string) error {
		conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		conn.LastSeen = time.Now().Unix()
		return nil
	})

	for {
		_, message, err := conn.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// 處理客戶端消息
		h.handleClientMessage(conn, message)
		conn.LastSeen = time.Now().Unix()
	}
}

// handleWrite 處理發送給客戶端的消息
func (h *Handler) handleWrite(conn *notification.Connection) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-conn.Send:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				conn.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ClientMessage 客戶端消息結構
type ClientMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// handleClientMessage 處理客戶端消息
func (h *Handler) handleClientMessage(conn *notification.Connection, message []byte) {
	var clientMsg ClientMessage
	if err := json.Unmarshal(message, &clientMsg); err != nil {
		log.Printf("Failed to unmarshal client message: %v", err)
		return
	}

	ctx := context.Background()

	switch clientMsg.Type {
	case "mark_as_read":
		h.handleMarkAsRead(ctx, conn, clientMsg.Data)
	case "mark_all_as_read":
		h.handleMarkAllAsRead(ctx, conn)
	case "get_unread_count":
		h.handleGetUnreadCount(ctx, conn)
	case "ping":
		h.handlePing(conn)
	default:
		log.Printf("Unknown message type: %s", clientMsg.Type)
	}
}

// handleMarkAsRead 處理標記為已讀
func (h *Handler) handleMarkAsRead(ctx context.Context, conn *notification.Connection, data interface{}) {
	dataMap, ok := data.(map[string]interface{})
	if !ok {
		return
	}

	notificationIDStr, ok := dataMap["notification_id"].(string)
	if !ok {
		return
	}

	notificationID, err := uuid.Parse(notificationIDStr)
	if err != nil {
		return
	}

	if err := h.service.MarkAsRead(ctx, notificationID); err != nil {
		log.Printf("Failed to mark notification as read: %v", err)
		return
	}

	// 發送確認消息
	response := map[string]interface{}{
		"type": "notification_read",
		"data": map[string]string{"notification_id": notificationIDStr},
	}
	h.sendMessage(conn, response)
}

// handleMarkAllAsRead 處理標記所有為已讀
func (h *Handler) handleMarkAllAsRead(ctx context.Context, conn *notification.Connection) {
	if err := h.service.MarkAllAsRead(ctx, conn.UserID); err != nil {
		log.Printf("Failed to mark all notifications as read: %v", err)
		return
	}

	// 發送確認消息
	response := map[string]interface{}{
		"type": "all_notifications_read",
		"data": map[string]string{"user_id": conn.UserID.String()},
	}
	h.sendMessage(conn, response)
}

// handleGetUnreadCount 處理獲取未讀數量
func (h *Handler) handleGetUnreadCount(ctx context.Context, conn *notification.Connection) {
	count, err := h.service.GetUnreadCount(ctx, conn.UserID)
	if err != nil {
		log.Printf("Failed to get unread count: %v", err)
		return
	}

	response := map[string]interface{}{
		"type": "unread_count",
		"data": map[string]int{"count": count},
	}
	h.sendMessage(conn, response)
}

// handlePing 處理 ping 消息
func (h *Handler) handlePing(conn *notification.Connection) {
	response := map[string]interface{}{
		"type": "pong",
		"data": map[string]interface{}{
			"timestamp": time.Now().Unix(),
		},
	}
	h.sendMessage(conn, response)
}

// sendWelcomeMessage 發送歡迎消息和未讀通知
func (h *Handler) sendWelcomeMessage(conn *notification.Connection) {
	ctx := context.Background()

	// 獲取未讀通知數量
	unreadCount, err := h.service.GetUnreadCount(ctx, conn.UserID)
	if err != nil {
		log.Printf("Failed to get unread count: %v", err)
		unreadCount = 0
	}

	// 發送歡迎消息
	welcome := map[string]interface{}{
		"type": "welcome",
		"data": map[string]interface{}{
			"user_id":      conn.UserID.String(),
			"connection_id": conn.ID.String(),
			"unread_count": unreadCount,
			"timestamp":    time.Now().Unix(),
		},
	}
	h.sendMessage(conn, welcome)

	// 如果有未讀通知，發送最近的幾個
	if unreadCount > 0 {
		notifications, err := h.service.GetUnreadNotifications(ctx, conn.UserID, 5, 0)
		if err == nil && len(notifications) > 0 {
			recentNotifications := map[string]interface{}{
				"type": "recent_notifications",
				"data": map[string]interface{}{
					"notifications": notifications,
					"total_count":   unreadCount,
				},
			}
			h.sendMessage(conn, recentNotifications)
		}
	}
}

// sendMessage 發送消息給連接
func (h *Handler) sendMessage(conn *notification.Connection, message interface{}) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}

	select {
	case conn.Send <- messageBytes:
	default:
		close(conn.Send)
	}
}

// GetOnlineUsers 獲取在線用戶信息（管理用）
func (h *Handler) GetOnlineUsers(c *gin.Context) {
	onlineCount := h.hub.GetOnlineUserCount()

	c.JSON(http.StatusOK, gin.H{
		"online_users": onlineCount,
		"timestamp":    time.Now().Unix(),
	})
}