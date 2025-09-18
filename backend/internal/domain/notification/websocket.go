package notification

import (
	"context"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Connection 代表一個 WebSocket 連接
type Connection struct {
	ID       uuid.UUID       `json:"id"`
	UserID   uuid.UUID       `json:"user_id"`
	Conn     *websocket.Conn `json:"-"`
	Send     chan []byte     `json:"-"`
	Hub      *Hub            `json:"-"`
	LastSeen int64           `json:"last_seen"`
}

// Hub 管理所有 WebSocket 連接
type Hub struct {
	// 已註冊的連接 map[userID]map[connectionID]*Connection
	connections map[uuid.UUID]map[uuid.UUID]*Connection

	// 註冊連接的通道
	register chan *Connection

	// 取消註冊連接的通道
	unregister chan *Connection

	// 廣播消息的通道
	broadcast chan []byte

	// 發送給特定用戶的通道
	userMessage chan *UserMessage

	// 互斥鎖
	mutex sync.RWMutex

	// 上下文
	ctx context.Context
}

// UserMessage 發送給特定用戶的消息
type UserMessage struct {
	UserID  uuid.UUID `json:"user_id"`
	Message []byte    `json:"message"`
}

// NotificationMessage WebSocket 通知消息格式
type NotificationMessage struct {
	Type string        `json:"type"`
	Data *Notification `json:"data"`
}

// NewHub 創建新的 Hub
func NewHub(ctx context.Context) *Hub {
	return &Hub{
		connections: make(map[uuid.UUID]map[uuid.UUID]*Connection),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
		broadcast:   make(chan []byte),
		userMessage: make(chan *UserMessage),
		ctx:         ctx,
	}
}

// Run 運行 Hub
func (h *Hub) Run() {
	for {
		select {
		case <-h.ctx.Done():
			return

		case conn := <-h.register:
			h.registerConnection(conn)

		case conn := <-h.unregister:
			h.unregisterConnection(conn)

		case message := <-h.broadcast:
			h.broadcastMessage(message)

		case userMsg := <-h.userMessage:
			h.sendToUser(userMsg.UserID, userMsg.Message)
		}
	}
}

// RegisterConnection 註冊新連接
func (h *Hub) RegisterConnection(conn *Connection) {
	h.register <- conn
}

// UnregisterConnection 取消註冊連接
func (h *Hub) UnregisterConnection(conn *Connection) {
	h.unregister <- conn
}

// BroadcastMessage 廣播消息
func (h *Hub) BroadcastMessage(message []byte) {
	h.broadcast <- message
}

// SendToUser 發送消息給特定用戶
func (h *Hub) SendToUser(userID uuid.UUID, message []byte) {
	h.userMessage <- &UserMessage{
		UserID:  userID,
		Message: message,
	}
}

// GetUserConnections 獲取用戶的所有連接
func (h *Hub) GetUserConnections(userID uuid.UUID) []*Connection {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	userConns, exists := h.connections[userID]
	if !exists {
		return nil
	}

	connections := make([]*Connection, 0, len(userConns))
	for _, conn := range userConns {
		connections = append(connections, conn)
	}

	return connections
}

// IsUserOnline 檢查用戶是否在線
func (h *Hub) IsUserOnline(userID uuid.UUID) bool {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	userConns, exists := h.connections[userID]
	return exists && len(userConns) > 0
}

// GetOnlineUserCount 獲取在線用戶數量
func (h *Hub) GetOnlineUserCount() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	return len(h.connections)
}

// registerConnection 內部方法：註冊連接
func (h *Hub) registerConnection(conn *Connection) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.connections[conn.UserID] == nil {
		h.connections[conn.UserID] = make(map[uuid.UUID]*Connection)
	}

	h.connections[conn.UserID][conn.ID] = conn
}

// unregisterConnection 內部方法：取消註冊連接
func (h *Hub) unregisterConnection(conn *Connection) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if userConns, exists := h.connections[conn.UserID]; exists {
		if _, exists := userConns[conn.ID]; exists {
			delete(userConns, conn.ID)
			close(conn.Send)

			// 如果用戶沒有其他連接，刪除整個 map
			if len(userConns) == 0 {
				delete(h.connections, conn.UserID)
			}
		}
	}
}

// broadcastMessage 內部方法：廣播消息
func (h *Hub) broadcastMessage(message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for _, userConns := range h.connections {
		for _, conn := range userConns {
			select {
			case conn.Send <- message:
			default:
				// 連接已關閉，將在下次迭代中清理
			}
		}
	}
}

// sendToUser 內部方法：發送消息給特定用戶
func (h *Hub) sendToUser(userID uuid.UUID, message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if userConns, exists := h.connections[userID]; exists {
		for _, conn := range userConns {
			select {
			case conn.Send <- message:
			default:
				// 連接已關閉，將在下次迭代中清理
			}
		}
	}
}