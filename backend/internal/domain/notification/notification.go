package notification

import (
	"time"

	"github.com/google/uuid"
)

// NotificationType 定義通知類型
type NotificationType string

const (
	// Ping 相關通知
	NotificationTypePingInvite    NotificationType = "ping_invite"
	NotificationTypePingAccepted  NotificationType = "ping_accepted"
	NotificationTypePingDeclined  NotificationType = "ping_declined"
	NotificationTypePingCancelled NotificationType = "ping_cancelled"

	// 好友相關通知
	NotificationTypeFriendRequest  NotificationType = "friend_request"
	NotificationTypeFriendAccepted NotificationType = "friend_accepted"

	// 群組相關通知
	NotificationTypeGroupInvite   NotificationType = "group_invite"
	NotificationTypeGroupActivity NotificationType = "group_activity"

	// 帳單相關通知
	NotificationTypeBillCreated NotificationType = "bill_created"
	NotificationTypeBillUpdated NotificationType = "bill_updated"
	NotificationTypeBillPaid    NotificationType = "bill_paid"

	// 系統通知
	NotificationTypeSystem NotificationType = "system"
)

// NotificationStatus 定義通知狀態
type NotificationStatus string

const (
	NotificationStatusPending NotificationStatus = "pending"
	NotificationStatusSent    NotificationStatus = "sent"
	NotificationStatusRead    NotificationStatus = "read"
	NotificationStatusFailed  NotificationStatus = "failed"
)

// Notification 通知實體
type Notification struct {
	ID         uuid.UUID          `json:"id"`
	ReceiverID uuid.UUID          `json:"receiver_id"`
	SenderID   *uuid.UUID         `json:"sender_id,omitempty"`
	Type       NotificationType   `json:"type"`
	Title      string             `json:"title"`
	Message    string             `json:"message"`
	Status     NotificationStatus `json:"status"`
	Data       map[string]any     `json:"data,omitempty"`
	CreatedAt  time.Time          `json:"created_at"`
	UpdatedAt  time.Time          `json:"updated_at"`
	ReadAt     *time.Time         `json:"read_at,omitempty"`
}

// NewNotification 創建新通知
func NewNotification(receiverID uuid.UUID, notificationType NotificationType, title, message string) *Notification {
	return &Notification{
		ID:         uuid.New(),
		ReceiverID: receiverID,
		Type:       notificationType,
		Title:      title,
		Message:    message,
		Status:     NotificationStatusPending,
		Data:       make(map[string]any),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
}

// SetSender 設置發送者
func (n *Notification) SetSender(senderID uuid.UUID) {
	n.SenderID = &senderID
	n.UpdatedAt = time.Now()
}

// SetData 設置通知數據
func (n *Notification) SetData(data map[string]any) {
	n.Data = data
	n.UpdatedAt = time.Now()
}

// MarkAsSent 標記為已發送
func (n *Notification) MarkAsSent() {
	n.Status = NotificationStatusSent
	n.UpdatedAt = time.Now()
}

// MarkAsRead 標記為已讀
func (n *Notification) MarkAsRead() {
	n.Status = NotificationStatusRead
	now := time.Now()
	n.ReadAt = &now
	n.UpdatedAt = now
}

// MarkAsFailed 標記為發送失敗
func (n *Notification) MarkAsFailed() {
	n.Status = NotificationStatusFailed
	n.UpdatedAt = time.Now()
}

// IsUnread 檢查是否未讀
func (n *Notification) IsUnread() bool {
	return n.Status == NotificationStatusPending || n.Status == NotificationStatusSent
}