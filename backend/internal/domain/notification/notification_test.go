package notification

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNewNotification(t *testing.T) {
	receiverID := uuid.New()
	notificationType := NotificationTypePingInvite
	title := "Test Notification"
	message := "This is a test notification"

	notification := NewNotification(receiverID, notificationType, title, message)

	// Validate basic properties
	if notification.ID == uuid.Nil {
		t.Error("Expected notification ID to be set")
	}

	if notification.ReceiverID != receiverID {
		t.Errorf("Expected receiver ID %v, got %v", receiverID, notification.ReceiverID)
	}

	if notification.Type != notificationType {
		t.Errorf("Expected type %v, got %v", notificationType, notification.Type)
	}

	if notification.Title != title {
		t.Errorf("Expected title %v, got %v", title, notification.Title)
	}

	if notification.Message != message {
		t.Errorf("Expected message %v, got %v", message, notification.Message)
	}

	if notification.Status != NotificationStatusPending {
		t.Errorf("Expected status %v, got %v", NotificationStatusPending, notification.Status)
	}

	if notification.Data == nil {
		t.Error("Expected data map to be initialized")
	}

	if time.Since(notification.CreatedAt) > time.Second {
		t.Error("Expected CreatedAt to be recent")
	}

	if time.Since(notification.UpdatedAt) > time.Second {
		t.Error("Expected UpdatedAt to be recent")
	}
}

func TestNotificationSetSender(t *testing.T) {
	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")
	senderID := uuid.New()

	originalUpdatedAt := notification.UpdatedAt
	time.Sleep(time.Millisecond) // Ensure time difference

	notification.SetSender(senderID)

	if notification.SenderID == nil {
		t.Error("Expected sender ID to be set")
	}

	if *notification.SenderID != senderID {
		t.Errorf("Expected sender ID %v, got %v", senderID, *notification.SenderID)
	}

	if !notification.UpdatedAt.After(originalUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestNotificationSetData(t *testing.T) {
	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")
	testData := map[string]any{
		"ping_id": "123",
		"location": "Restaurant ABC",
	}

	originalUpdatedAt := notification.UpdatedAt
	time.Sleep(time.Millisecond) // Ensure time difference

	notification.SetData(testData)

	if notification.Data["ping_id"] != "123" {
		t.Errorf("Expected ping_id to be '123', got %v", notification.Data["ping_id"])
	}

	if notification.Data["location"] != "Restaurant ABC" {
		t.Errorf("Expected location to be 'Restaurant ABC', got %v", notification.Data["location"])
	}

	if !notification.UpdatedAt.After(originalUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestNotificationMarkAsSent(t *testing.T) {
	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")

	originalUpdatedAt := notification.UpdatedAt
	time.Sleep(time.Millisecond) // Ensure time difference

	notification.MarkAsSent()

	if notification.Status != NotificationStatusSent {
		t.Errorf("Expected status %v, got %v", NotificationStatusSent, notification.Status)
	}

	if !notification.UpdatedAt.After(originalUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestNotificationMarkAsRead(t *testing.T) {
	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")

	originalUpdatedAt := notification.UpdatedAt
	time.Sleep(time.Millisecond) // Ensure time difference

	notification.MarkAsRead()

	if notification.Status != NotificationStatusRead {
		t.Errorf("Expected status %v, got %v", NotificationStatusRead, notification.Status)
	}

	if notification.ReadAt == nil {
		t.Error("Expected ReadAt to be set")
	}

	if time.Since(*notification.ReadAt) > time.Second {
		t.Error("Expected ReadAt to be recent")
	}

	if !notification.UpdatedAt.After(originalUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestNotificationMarkAsFailed(t *testing.T) {
	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")

	originalUpdatedAt := notification.UpdatedAt
	time.Sleep(time.Millisecond) // Ensure time difference

	notification.MarkAsFailed()

	if notification.Status != NotificationStatusFailed {
		t.Errorf("Expected status %v, got %v", NotificationStatusFailed, notification.Status)
	}

	if !notification.UpdatedAt.After(originalUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestNotificationIsUnread(t *testing.T) {
	tests := []struct {
		name     string
		status   NotificationStatus
		expected bool
	}{
		{"Pending notification is unread", NotificationStatusPending, true},
		{"Sent notification is unread", NotificationStatusSent, true},
		{"Read notification is not unread", NotificationStatusRead, false},
		{"Failed notification is not unread", NotificationStatusFailed, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")
			notification.Status = tt.status

			if notification.IsUnread() != tt.expected {
				t.Errorf("Expected IsUnread() to return %v for status %v", tt.expected, tt.status)
			}
		})
	}
}

func TestNotificationTypes(t *testing.T) {
	expectedTypes := []NotificationType{
		NotificationTypePingInvite,
		NotificationTypePingAccepted,
		NotificationTypePingDeclined,
		NotificationTypePingCancelled,
		NotificationTypeFriendRequest,
		NotificationTypeFriendAccepted,
		NotificationTypeGroupInvite,
		NotificationTypeGroupActivity,
		NotificationTypeBillCreated,
		NotificationTypeBillUpdated,
		NotificationTypeBillPaid,
		NotificationTypeSystem,
	}

	// Verify all notification types are defined
	for _, notType := range expectedTypes {
		notification := NewNotification(uuid.New(), notType, "Test", "Test")
		if notification.Type != notType {
			t.Errorf("Expected notification type %v, got %v", notType, notification.Type)
		}
	}
}

func TestNotificationStatuses(t *testing.T) {
	expectedStatuses := []NotificationStatus{
		NotificationStatusPending,
		NotificationStatusSent,
		NotificationStatusRead,
		NotificationStatusFailed,
	}

	notification := NewNotification(uuid.New(), NotificationTypePingInvite, "Test", "Test")

	// Test all status transitions
	for _, status := range expectedStatuses {
		notification.Status = status
		if notification.Status != status {
			t.Errorf("Expected notification status %v, got %v", status, notification.Status)
		}
	}
}