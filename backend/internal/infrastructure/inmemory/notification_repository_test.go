package inmemory

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
)

func TestNotificationRepositoryCreate(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	notif := notification.NewNotification(
		uuid.New(),
		notification.NotificationTypePingInvite,
		"Test Notification",
		"This is a test",
	)

	err := repo.Create(ctx, notif)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify notification was stored
	retrieved, err := repo.GetByID(ctx, notif.ID)
	if err != nil {
		t.Fatalf("Expected no error retrieving notification, got %v", err)
	}

	if retrieved.ID != notif.ID {
		t.Errorf("Expected ID %v, got %v", notif.ID, retrieved.ID)
	}

	if retrieved.Title != notif.Title {
		t.Errorf("Expected title %v, got %v", notif.Title, retrieved.Title)
	}
}

func TestNotificationRepositoryGetByIDNotFound(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	nonExistentID := uuid.New()
	_, err := repo.GetByID(ctx, nonExistentID)

	if err != notification.ErrNotificationNotFound {
		t.Errorf("Expected ErrNotificationNotFound, got %v", err)
	}
}

func TestNotificationRepositoryGetByReceiverID(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Create multiple notifications for the same receiver
	notif1 := notification.NewNotification(receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1")
	notif2 := notification.NewNotification(receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2")
	notif3 := notification.NewNotification(uuid.New(), notification.NotificationTypeSystem, "Test 3", "Message 3") // Different receiver

	// Add some delay to ensure different timestamps
	time.Sleep(time.Millisecond)
	notif2.CreatedAt = time.Now()

	err := repo.Create(ctx, notif1)
	if err != nil {
		t.Fatalf("Error creating notif1: %v", err)
	}

	err = repo.Create(ctx, notif2)
	if err != nil {
		t.Fatalf("Error creating notif2: %v", err)
	}

	err = repo.Create(ctx, notif3)
	if err != nil {
		t.Fatalf("Error creating notif3: %v", err)
	}

	// Get notifications for the receiver
	notifications, err := repo.GetByReceiverID(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting notifications: %v", err)
	}

	// Should get 2 notifications for this receiver
	if len(notifications) != 2 {
		t.Errorf("Expected 2 notifications, got %d", len(notifications))
	}

	// Should be sorted by creation time (newest first)
	if len(notifications) >= 2 {
		if notifications[0].CreatedAt.Before(notifications[1].CreatedAt) {
			t.Error("Expected notifications to be sorted by creation time (newest first)")
		}
	}
}

func TestNotificationRepositoryGetUnreadByReceiverID(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Create notifications with different statuses
	notif1 := notification.NewNotification(receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1")
	notif2 := notification.NewNotification(receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2")
	notif3 := notification.NewNotification(receiverID, notification.NotificationTypeSystem, "Test 3", "Message 3")

	// Mark notif2 as read
	notif2.MarkAsRead()

	err := repo.Create(ctx, notif1)
	if err != nil {
		t.Fatalf("Error creating notif1: %v", err)
	}

	err = repo.Create(ctx, notif2)
	if err != nil {
		t.Fatalf("Error creating notif2: %v", err)
	}

	err = repo.Create(ctx, notif3)
	if err != nil {
		t.Fatalf("Error creating notif3: %v", err)
	}

	// Get unread notifications
	unreadNotifications, err := repo.GetUnreadByReceiverID(ctx, receiverID, 10, 0)
	if err != nil {
		t.Fatalf("Error getting unread notifications: %v", err)
	}

	// Should get 2 unread notifications (notif1 and notif3)
	if len(unreadNotifications) != 2 {
		t.Errorf("Expected 2 unread notifications, got %d", len(unreadNotifications))
	}

	// Verify none of the returned notifications are read
	for _, notif := range unreadNotifications {
		if !notif.IsUnread() {
			t.Error("Expected all returned notifications to be unread")
		}
	}
}

func TestNotificationRepositoryCountUnreadByReceiverID(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Initially should be 0
	count, err := repo.CountUnreadByReceiverID(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error counting unread notifications: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 unread notifications initially, got %d", count)
	}

	// Create notifications
	notif1 := notification.NewNotification(receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1")
	notif2 := notification.NewNotification(receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2")

	err = repo.Create(ctx, notif1)
	if err != nil {
		t.Fatalf("Error creating notif1: %v", err)
	}

	err = repo.Create(ctx, notif2)
	if err != nil {
		t.Fatalf("Error creating notif2: %v", err)
	}

	// Should have 2 unread
	count, err = repo.CountUnreadByReceiverID(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error counting unread notifications: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 unread notifications, got %d", count)
	}

	// Mark one as read
	err = repo.MarkAsRead(ctx, notif1.ID)
	if err != nil {
		t.Fatalf("Error marking notification as read: %v", err)
	}

	// Should have 1 unread
	count, err = repo.CountUnreadByReceiverID(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error counting unread notifications: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 unread notification, got %d", count)
	}
}

func TestNotificationRepositoryUpdate(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	notif := notification.NewNotification(
		uuid.New(),
		notification.NotificationTypePingInvite,
		"Original Title",
		"Original Message",
	)

	err := repo.Create(ctx, notif)
	if err != nil {
		t.Fatalf("Error creating notification: %v", err)
	}

	// Update the notification
	notif.Title = "Updated Title"
	notif.Message = "Updated Message"

	err = repo.Update(ctx, notif)
	if err != nil {
		t.Fatalf("Error updating notification: %v", err)
	}

	// Retrieve and verify update
	retrieved, err := repo.GetByID(ctx, notif.ID)
	if err != nil {
		t.Fatalf("Error retrieving updated notification: %v", err)
	}

	if retrieved.Title != "Updated Title" {
		t.Errorf("Expected title 'Updated Title', got %v", retrieved.Title)
	}

	if retrieved.Message != "Updated Message" {
		t.Errorf("Expected message 'Updated Message', got %v", retrieved.Message)
	}
}

func TestNotificationRepositoryMarkAllAsRead(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Create multiple unread notifications
	notif1 := notification.NewNotification(receiverID, notification.NotificationTypePingInvite, "Test 1", "Message 1")
	notif2 := notification.NewNotification(receiverID, notification.NotificationTypeFriendRequest, "Test 2", "Message 2")
	notif3 := notification.NewNotification(uuid.New(), notification.NotificationTypeSystem, "Test 3", "Message 3") // Different receiver

	err := repo.Create(ctx, notif1)
	if err != nil {
		t.Fatalf("Error creating notif1: %v", err)
	}

	err = repo.Create(ctx, notif2)
	if err != nil {
		t.Fatalf("Error creating notif2: %v", err)
	}

	err = repo.Create(ctx, notif3)
	if err != nil {
		t.Fatalf("Error creating notif3: %v", err)
	}

	// Mark all as read for the receiver
	err = repo.MarkAllAsRead(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error marking all as read: %v", err)
	}

	// Verify unread count is 0 for this receiver
	count, err := repo.CountUnreadByReceiverID(ctx, receiverID)
	if err != nil {
		t.Fatalf("Error counting unread notifications: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 unread notifications after marking all as read, got %d", count)
	}

	// Verify the other receiver's notification is still unread
	otherReceiverUnreadCount, err := repo.CountUnreadByReceiverID(ctx, notif3.ReceiverID)
	if err != nil {
		t.Fatalf("Error counting unread notifications for other receiver: %v", err)
	}

	if otherReceiverUnreadCount != 1 {
		t.Errorf("Expected 1 unread notification for other receiver, got %d", otherReceiverUnreadCount)
	}
}

func TestNotificationRepositoryDelete(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	notif := notification.NewNotification(
		uuid.New(),
		notification.NotificationTypePingInvite,
		"Test Notification",
		"This is a test",
	)

	err := repo.Create(ctx, notif)
	if err != nil {
		t.Fatalf("Error creating notification: %v", err)
	}

	// Delete the notification
	err = repo.Delete(ctx, notif.ID)
	if err != nil {
		t.Fatalf("Error deleting notification: %v", err)
	}

	// Verify it's gone
	_, err = repo.GetByID(ctx, notif.ID)
	if err != notification.ErrNotificationNotFound {
		t.Errorf("Expected ErrNotificationNotFound after deletion, got %v", err)
	}
}

func TestNotificationRepositoryDeleteOld(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Create an old notification
	oldNotif := notification.NewNotification(receiverID, notification.NotificationTypePingInvite, "Old", "Old message")
	oldNotif.CreatedAt = time.Now().AddDate(0, 0, -10) // 10 days ago

	// Create a recent notification
	recentNotif := notification.NewNotification(receiverID, notification.NotificationTypeFriendRequest, "Recent", "Recent message")

	err := repo.Create(ctx, oldNotif)
	if err != nil {
		t.Fatalf("Error creating old notification: %v", err)
	}

	err = repo.Create(ctx, recentNotif)
	if err != nil {
		t.Fatalf("Error creating recent notification: %v", err)
	}

	// Delete notifications older than 7 days
	err = repo.DeleteOld(ctx, 7)
	if err != nil {
		t.Fatalf("Error deleting old notifications: %v", err)
	}

	// Verify old notification is gone
	_, err = repo.GetByID(ctx, oldNotif.ID)
	if err != notification.ErrNotificationNotFound {
		t.Errorf("Expected old notification to be deleted")
	}

	// Verify recent notification still exists
	_, err = repo.GetByID(ctx, recentNotif.ID)
	if err != nil {
		t.Errorf("Expected recent notification to still exist, got error: %v", err)
	}
}

func TestNotificationRepositoryPagination(t *testing.T) {
	repo := NewNotificationRepository()
	ctx := context.Background()

	receiverID := uuid.New()

	// Create 5 notifications
	for i := 0; i < 5; i++ {
		notif := notification.NewNotification(
			receiverID,
			notification.NotificationTypePingInvite,
			"Test "+string(rune('A'+i)),
			"Message "+string(rune('A'+i)),
		)
		// Add delay to ensure different timestamps
		time.Sleep(time.Millisecond)
		err := repo.Create(ctx, notif)
		if err != nil {
			t.Fatalf("Error creating notification %d: %v", i, err)
		}
	}

	// Test first page (limit 2, offset 0)
	notifications, err := repo.GetByReceiverID(ctx, receiverID, 2, 0)
	if err != nil {
		t.Fatalf("Error getting first page: %v", err)
	}

	if len(notifications) != 2 {
		t.Errorf("Expected 2 notifications on first page, got %d", len(notifications))
	}

	// Test second page (limit 2, offset 2)
	notifications, err = repo.GetByReceiverID(ctx, receiverID, 2, 2)
	if err != nil {
		t.Fatalf("Error getting second page: %v", err)
	}

	if len(notifications) != 2 {
		t.Errorf("Expected 2 notifications on second page, got %d", len(notifications))
	}

	// Test third page (limit 2, offset 4) - should have 1 notification
	notifications, err = repo.GetByReceiverID(ctx, receiverID, 2, 4)
	if err != nil {
		t.Fatalf("Error getting third page: %v", err)
	}

	if len(notifications) != 1 {
		t.Errorf("Expected 1 notification on third page, got %d", len(notifications))
	}

	// Test beyond available data
	notifications, err = repo.GetByReceiverID(ctx, receiverID, 2, 10)
	if err != nil {
		t.Fatalf("Error getting page beyond data: %v", err)
	}

	if len(notifications) != 0 {
		t.Errorf("Expected 0 notifications beyond available data, got %d", len(notifications))
	}
}