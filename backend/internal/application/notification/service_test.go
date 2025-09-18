package notification

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
)

// MockNotificationRepository for testing
type MockNotificationRepository struct {
	notifications map[uuid.UUID]*notification.Notification
	userIndex     map[uuid.UUID][]uuid.UUID
}

func NewMockNotificationRepository() *MockNotificationRepository {
	return &MockNotificationRepository{
		notifications: make(map[uuid.UUID]*notification.Notification),
		userIndex:     make(map[uuid.UUID][]uuid.UUID),
	}
}

func (m *MockNotificationRepository) Create(ctx context.Context, notif *notification.Notification) error {
	m.notifications[notif.ID] = notif
	if m.userIndex[notif.ReceiverID] == nil {
		m.userIndex[notif.ReceiverID] = make([]uuid.UUID, 0)
	}
	m.userIndex[notif.ReceiverID] = append(m.userIndex[notif.ReceiverID], notif.ID)
	return nil
}

func (m *MockNotificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*notification.Notification, error) {
	notif, exists := m.notifications[id]
	if !exists {
		return nil, notification.ErrNotificationNotFound
	}
	return notif, nil
}

func (m *MockNotificationRepository) GetByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	notificationIDs, exists := m.userIndex[receiverID]
	if !exists {
		return []*notification.Notification{}, nil
	}

	start := offset
	if start >= len(notificationIDs) {
		return []*notification.Notification{}, nil
	}

	end := start + limit
	if end > len(notificationIDs) {
		end = len(notificationIDs)
	}

	result := make([]*notification.Notification, 0, end-start)
	for i := start; i < end; i++ {
		if notif, exists := m.notifications[notificationIDs[i]]; exists {
			result = append(result, notif)
		}
	}

	return result, nil
}

func (m *MockNotificationRepository) GetUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	notificationIDs, exists := m.userIndex[receiverID]
	if !exists {
		return []*notification.Notification{}, nil
	}

	unreadIDs := make([]uuid.UUID, 0)
	for _, id := range notificationIDs {
		if notif, exists := m.notifications[id]; exists && notif.IsUnread() {
			unreadIDs = append(unreadIDs, id)
		}
	}

	start := offset
	if start >= len(unreadIDs) {
		return []*notification.Notification{}, nil
	}

	end := start + limit
	if end > len(unreadIDs) {
		end = len(unreadIDs)
	}

	result := make([]*notification.Notification, 0, end-start)
	for i := start; i < end; i++ {
		if notif, exists := m.notifications[unreadIDs[i]]; exists {
			result = append(result, notif)
		}
	}

	return result, nil
}

func (m *MockNotificationRepository) CountUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID) (int, error) {
	notificationIDs, exists := m.userIndex[receiverID]
	if !exists {
		return 0, nil
	}

	count := 0
	for _, id := range notificationIDs {
		if notif, exists := m.notifications[id]; exists && notif.IsUnread() {
			count++
		}
	}

	return count, nil
}

func (m *MockNotificationRepository) Update(ctx context.Context, notif *notification.Notification) error {
	if _, exists := m.notifications[notif.ID]; !exists {
		return notification.ErrNotificationNotFound
	}
	m.notifications[notif.ID] = notif
	return nil
}

func (m *MockNotificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	notif, exists := m.notifications[id]
	if !exists {
		return notification.ErrNotificationNotFound
	}
	notif.MarkAsRead()
	return nil
}

func (m *MockNotificationRepository) MarkAllAsRead(ctx context.Context, receiverID uuid.UUID) error {
	notificationIDs, exists := m.userIndex[receiverID]
	if !exists {
		return nil
	}

	for _, id := range notificationIDs {
		if notif, exists := m.notifications[id]; exists && notif.IsUnread() {
			notif.MarkAsRead()
		}
	}

	return nil
}

func (m *MockNotificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	notif, exists := m.notifications[id]
	if !exists {
		return notification.ErrNotificationNotFound
	}

	delete(m.notifications, id)

	if notificationIDs, exists := m.userIndex[notif.ReceiverID]; exists {
		for i, notifID := range notificationIDs {
			if notifID == id {
				m.userIndex[notif.ReceiverID] = append(notificationIDs[:i], notificationIDs[i+1:]...)
				break
			}
		}
	}

	return nil
}

func (m *MockNotificationRepository) DeleteOld(ctx context.Context, days int) error {
	// For testing purposes, we'll just return nil
	return nil
}

// MockHub for testing
type MockHub struct {
	sentMessages map[uuid.UUID][]byte
	userOnline   map[uuid.UUID]bool
}

func NewMockHub() *MockHub {
	return &MockHub{
		sentMessages: make(map[uuid.UUID][]byte),
		userOnline:   make(map[uuid.UUID]bool),
	}
}

func (m *MockHub) SendToUser(userID uuid.UUID, message []byte) {
	m.sentMessages[userID] = message
}

func (m *MockHub) IsUserOnline(userID uuid.UUID) bool {
	return m.userOnline[userID]
}

func (m *MockHub) BroadcastMessage(message []byte) {
	// For testing, we'll just store it under a special key
	m.sentMessages[uuid.Nil] = message
}

func (m *MockHub) SetUserOnline(userID uuid.UUID, online bool) {
	m.userOnline[userID] = online
}

func (m *MockHub) GetSentMessage(userID uuid.UUID) []byte {
	return m.sentMessages[userID]
}

func TestNotificationServiceCreateNotification(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()
	senderID := uuid.New()
	notificationType := notification.NotificationTypePingInvite
	title := "Test Notification"
	message := "This is a test notification"
	data := map[string]any{
		"ping_id": "123",
		"location": "Test Restaurant",
	}

	err := service.CreateNotification(ctx, receiverID, notificationType, title, message, data, &senderID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify notification was created
	notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting user notifications: %v", err)
	}

	if len(notifications) != 1 {
		t.Errorf("Expected 1 notification, got %d", len(notifications))
	}

	notif := notifications[0]
	if notif.Title != title {
		t.Errorf("Expected title %v, got %v", title, notif.Title)
	}

	if notif.Message != message {
		t.Errorf("Expected message %v, got %v", message, notif.Message)
	}

	if notif.Type != notificationType {
		t.Errorf("Expected type %v, got %v", notificationType, notif.Type)
	}

	if notif.SenderID == nil || *notif.SenderID != senderID {
		t.Errorf("Expected sender ID %v, got %v", senderID, notif.SenderID)
	}

	if notif.Data["ping_id"] != "123" {
		t.Errorf("Expected ping_id to be '123', got %v", notif.Data["ping_id"])
	}
}

func TestNotificationServiceCreateNotificationOnlineUser(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()
	hub.SetUserOnline(receiverID, true)

	err := service.CreateNotification(
		ctx,
		receiverID,
		notification.NotificationTypePingInvite,
		"Test",
		"Test message",
		nil,
		nil,
	)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify WebSocket message was sent
	sentMessage := hub.GetSentMessage(receiverID)
	if sentMessage == nil {
		t.Error("Expected WebSocket message to be sent to online user")
	}
}

func TestNotificationServiceSendPingInviteNotification(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()
	senderID := uuid.New()
	pingID := uuid.New()
	senderName := "John Doe"
	pingTitle := "Lunch at Italian Restaurant"

	err := service.SendPingInviteNotification(ctx, receiverID, senderID, pingID, senderName, pingTitle)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify notification was created with correct content
	notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting user notifications: %v", err)
	}

	if len(notifications) != 1 {
		t.Errorf("Expected 1 notification, got %d", len(notifications))
	}

	notif := notifications[0]
	if notif.Type != notification.NotificationTypePingInvite {
		t.Errorf("Expected type %v, got %v", notification.NotificationTypePingInvite, notif.Type)
	}

	expectedTitle := "新的 Ping 邀請"
	if notif.Title != expectedTitle {
		t.Errorf("Expected title %v, got %v", expectedTitle, notif.Title)
	}

	expectedMessage := "John Doe 邀請您參加「Lunch at Italian Restaurant」"
	if notif.Message != expectedMessage {
		t.Errorf("Expected message %v, got %v", expectedMessage, notif.Message)
	}

	if notif.Data["ping_id"] != pingID.String() {
		t.Errorf("Expected ping_id %v, got %v", pingID.String(), notif.Data["ping_id"])
	}

	if notif.Data["sender_name"] != senderName {
		t.Errorf("Expected sender_name %v, got %v", senderName, notif.Data["sender_name"])
	}
}

func TestNotificationServiceSendFriendRequestNotification(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()
	senderID := uuid.New()
	senderName := "Jane Smith"

	err := service.SendFriendRequestNotification(ctx, receiverID, senderID, senderName)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify notification was created with correct content
	notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting user notifications: %v", err)
	}

	if len(notifications) != 1 {
		t.Errorf("Expected 1 notification, got %d", len(notifications))
	}

	notif := notifications[0]
	if notif.Type != notification.NotificationTypeFriendRequest {
		t.Errorf("Expected type %v, got %v", notification.NotificationTypeFriendRequest, notif.Type)
	}

	expectedTitle := "新的好友邀請"
	if notif.Title != expectedTitle {
		t.Errorf("Expected title %v, got %v", expectedTitle, notif.Title)
	}

	expectedMessage := "Jane Smith 想加您為好友"
	if notif.Message != expectedMessage {
		t.Errorf("Expected message %v, got %v", expectedMessage, notif.Message)
	}
}

func TestNotificationServiceGetUnreadCount(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()

	// Initially should be 0
	count, err := service.GetUnreadCount(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error getting unread count: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 unread notifications initially, got %d", count)
	}

	// Create notifications
	err = service.CreateNotification(ctx, receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1", nil, nil)
	if err != nil {
		t.Fatalf("Error creating first notification: %v", err)
	}

	err = service.CreateNotification(ctx, receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2", nil, nil)
	if err != nil {
		t.Fatalf("Error creating second notification: %v", err)
	}

	// Should have 2 unread
	count, err = service.GetUnreadCount(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error getting unread count: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 unread notifications, got %d", count)
	}
}

func TestNotificationServiceMarkAsRead(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()

	// Create a notification
	err := service.CreateNotification(ctx, receiverID, notification.NotificationTypePingInvite, "Test", "Message", nil, nil)
	if err != nil {
		t.Fatalf("Error creating notification: %v", err)
	}

	// Get the notification ID
	notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting notifications: %v", err)
	}

	if len(notifications) != 1 {
		t.Fatalf("Expected 1 notification, got %d", len(notifications))
	}

	notificationID := notifications[0].ID

	// Mark as read
	err = service.MarkAsRead(ctx, notificationID)
	if err != nil {
		t.Fatalf("Error marking as read: %v", err)
	}

	// Verify unread count is 0
	count, err := service.GetUnreadCount(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error getting unread count: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 unread notifications after marking as read, got %d", count)
	}
}

func TestNotificationServiceMarkAllAsRead(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	receiverID := uuid.New()

	// Create multiple notifications
	err := service.CreateNotification(ctx, receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1", nil, nil)
	if err != nil {
		t.Fatalf("Error creating first notification: %v", err)
	}

	err = service.CreateNotification(ctx, receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2", nil, nil)
	if err != nil {
		t.Fatalf("Error creating second notification: %v", err)
	}

	// Verify we have 2 unread
	count, err := service.GetUnreadCount(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error getting unread count: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 unread notifications, got %d", count)
	}

	// Mark all as read
	err = service.MarkAllAsRead(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error marking all as read: %v", err)
	}

	// Verify unread count is 0
	count, err = service.GetUnreadCount(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error getting unread count: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 unread notifications after marking all as read, got %d", count)
	}
}

func TestNotificationServiceBroadcastSystemNotification(t *testing.T) {
	repo := NewMockNotificationRepository()
	hub := NewMockHub()
	service := NewService(repo, hub)
	ctx := context.Background()

	title := "System Maintenance"
	message := "The system will be under maintenance for 2 hours"
	data := map[string]any{
		"maintenance_start": "2024-01-01T02:00:00Z",
		"maintenance_end":   "2024-01-01T04:00:00Z",
	}

	err := service.BroadcastSystemNotification(ctx, title, message, data)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify broadcast message was sent
	broadcastMessage := hub.GetSentMessage(uuid.Nil) // We use uuid.Nil for broadcast messages in our mock
	if broadcastMessage == nil {
		t.Error("Expected broadcast message to be sent")
	}
}