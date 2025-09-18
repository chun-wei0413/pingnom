package notification

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
)

// Service 通知服務
type Service struct {
	repo notification.Repository
	hub  *notification.Hub
}

// NewService 創建新的通知服務
func NewService(repo notification.Repository, hub *notification.Hub) *Service {
	return &Service{
		repo: repo,
		hub:  hub,
	}
}

// CreateNotification 創建並發送通知
func (s *Service) CreateNotification(ctx context.Context, receiverID uuid.UUID, notificationType notification.NotificationType, title, message string, data map[string]any, senderID *uuid.UUID) error {
	// 創建通知實體
	notif := notification.NewNotification(receiverID, notificationType, title, message)

	if senderID != nil {
		notif.SetSender(*senderID)
	}

	if data != nil {
		notif.SetData(data)
	}

	// 保存到儲存庫
	if err := s.repo.Create(ctx, notif); err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}

	// 如果用戶在線，立即發送 WebSocket 通知
	if s.hub.IsUserOnline(receiverID) {
		if err := s.sendWebSocketNotification(notif); err != nil {
			// 記錄錯誤但不返回，因為通知已保存
			fmt.Printf("Failed to send WebSocket notification: %v\n", err)
		} else {
			notif.MarkAsSent()
			s.repo.Update(ctx, notif)
		}
	}

	return nil
}

// SendPingInviteNotification 發送 Ping 邀請通知
func (s *Service) SendPingInviteNotification(ctx context.Context, receiverID, senderID, pingID uuid.UUID, senderName, pingTitle string) error {
	title := "新的 Ping 邀請"
	message := fmt.Sprintf("%s 邀請您參加「%s」", senderName, pingTitle)
	data := map[string]any{
		"ping_id":     pingID.String(),
		"sender_id":   senderID.String(),
		"sender_name": senderName,
		"ping_title":  pingTitle,
	}

	return s.CreateNotification(ctx, receiverID, notification.NotificationTypePingInvite, title, message, data, &senderID)
}

// SendFriendRequestNotification 發送好友邀請通知
func (s *Service) SendFriendRequestNotification(ctx context.Context, receiverID, senderID uuid.UUID, senderName string) error {
	title := "新的好友邀請"
	message := fmt.Sprintf("%s 想加您為好友", senderName)
	data := map[string]any{
		"sender_id":   senderID.String(),
		"sender_name": senderName,
	}

	return s.CreateNotification(ctx, receiverID, notification.NotificationTypeFriendRequest, title, message, data, &senderID)
}

// SendBillNotification 發送帳單通知
func (s *Service) SendBillNotification(ctx context.Context, receiverID, senderID, billID uuid.UUID, billTitle, action string) error {
	title := fmt.Sprintf("帳單%s", action)
	message := fmt.Sprintf("帳單「%s」已%s", billTitle, action)
	data := map[string]any{
		"bill_id":    billID.String(),
		"sender_id":  senderID.String(),
		"bill_title": billTitle,
		"action":     action,
	}

	var notificationType notification.NotificationType
	switch action {
	case "創建":
		notificationType = notification.NotificationTypeBillCreated
	case "更新":
		notificationType = notification.NotificationTypeBillUpdated
	case "付款":
		notificationType = notification.NotificationTypeBillPaid
	default:
		notificationType = notification.NotificationTypeBillUpdated
	}

	return s.CreateNotification(ctx, receiverID, notificationType, title, message, data, &senderID)
}

// GetUserNotifications 獲取用戶通知
func (s *Service) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	return s.repo.GetByReceiverID(ctx, userID, limit, offset)
}

// GetUnreadNotifications 獲取用戶未讀通知
func (s *Service) GetUnreadNotifications(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	return s.repo.GetUnreadByReceiverID(ctx, userID, limit, offset)
}

// GetUnreadCount 獲取未讀通知數量
func (s *Service) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.repo.CountUnreadByReceiverID(ctx, userID)
}

// MarkAsRead 標記通知為已讀
func (s *Service) MarkAsRead(ctx context.Context, notificationID uuid.UUID) error {
	return s.repo.MarkAsRead(ctx, notificationID)
}

// MarkAllAsRead 標記所有通知為已讀
func (s *Service) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}

// sendWebSocketNotification 發送 WebSocket 通知
func (s *Service) sendWebSocketNotification(notif *notification.Notification) error {
	message := &notification.NotificationMessage{
		Type: "notification",
		Data: notif,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal notification message: %w", err)
	}

	s.hub.SendToUser(notif.ReceiverID, messageBytes)
	return nil
}

// BroadcastSystemNotification 廣播系統通知
func (s *Service) BroadcastSystemNotification(ctx context.Context, title, message string, data map[string]any) error {
	// 創建系統通知消息
	notifMessage := &notification.NotificationMessage{
		Type: "system_notification",
		Data: &notification.Notification{
			ID:      uuid.New(),
			Type:    notification.NotificationTypeSystem,
			Title:   title,
			Message: message,
			Data:    data,
		},
	}

	messageBytes, err := json.Marshal(notifMessage)
	if err != nil {
		return fmt.Errorf("failed to marshal system notification: %w", err)
	}

	s.hub.BroadcastMessage(messageBytes)
	return nil
}