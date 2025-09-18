package test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/inmemory"
	notificationApp "github.com/chun-wei0413/pingnom/internal/application/notification"
)

func TestNotificationIntegration(t *testing.T) {
	// Setup
	ctx := context.Background()
	repo := inmemory.NewNotificationRepository()
	hub := notification.NewHub(ctx)
	go hub.Run()
	service := notificationApp.NewService(repo, hub)

	t.Run("Create and retrieve notification", func(t *testing.T) {
		receiverID := uuid.New()
		senderID := uuid.New()

		// Create notification
		err := service.CreateNotification(
			ctx,
			receiverID,
			notification.NotificationTypePingInvite,
			"Test Ping",
			"You have a new ping invitation",
			map[string]any{"ping_id": "123"},
			&senderID,
		)

		if err != nil {
			t.Fatalf("Failed to create notification: %v", err)
		}

		// Retrieve notifications
		notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
		if err != nil {
			t.Fatalf("Failed to get notifications: %v", err)
		}

		if len(notifications) != 1 {
			t.Errorf("Expected 1 notification, got %d", len(notifications))
		}

		notif := notifications[0]
		if notif.Title != "Test Ping" {
			t.Errorf("Expected title 'Test Ping', got %s", notif.Title)
		}

		if notif.Type != notification.NotificationTypePingInvite {
			t.Errorf("Expected type %s, got %s", notification.NotificationTypePingInvite, notif.Type)
		}
	})

	t.Run("Unread count functionality", func(t *testing.T) {
		receiverID := uuid.New()

		// Initially should be 0
		count, err := service.GetUnreadCount(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to get unread count: %v", err)
		}

		if count != 0 {
			t.Errorf("Expected 0 unread notifications, got %d", count)
		}

		// Create notification
		err = service.CreateNotification(
			ctx,
			receiverID,
			notification.NotificationTypeFriendRequest,
			"Friend Request",
			"Someone wants to be your friend",
			nil,
			nil,
		)

		if err != nil {
			t.Fatalf("Failed to create notification: %v", err)
		}

		// Should have 1 unread
		count, err = service.GetUnreadCount(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to get unread count: %v", err)
		}

		if count != 1 {
			t.Errorf("Expected 1 unread notification, got %d", count)
		}

		// Get the notification and mark as read
		notifications, err := service.GetUserNotifications(ctx, receiverID, 10, 0)
		if err != nil {
			t.Fatalf("Failed to get notifications: %v", err)
		}

		err = service.MarkAsRead(ctx, notifications[0].ID)
		if err != nil {
			t.Fatalf("Failed to mark as read: %v", err)
		}

		// Should be 0 again
		count, err = service.GetUnreadCount(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to get unread count: %v", err)
		}

		if count != 0 {
			t.Errorf("Expected 0 unread notifications after marking as read, got %d", count)
		}
	})

	t.Run("Mark all as read functionality", func(t *testing.T) {
		receiverID := uuid.New()

		// Create multiple notifications
		for i := 0; i < 3; i++ {
			err := service.CreateNotification(
				ctx,
				receiverID,
				notification.NotificationTypeSystem,
				"System Message",
				"System notification",
				nil,
				nil,
			)

			if err != nil {
				t.Fatalf("Failed to create notification %d: %v", i, err)
			}
		}

		// Should have 3 unread
		count, err := service.GetUnreadCount(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to get unread count: %v", err)
		}

		if count != 3 {
			t.Errorf("Expected 3 unread notifications, got %d", count)
		}

		// Mark all as read
		err = service.MarkAllAsRead(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to mark all as read: %v", err)
		}

		// Should be 0
		count, err = service.GetUnreadCount(ctx, receiverID)
		if err != nil {
			t.Fatalf("Failed to get unread count: %v", err)
		}

		if count != 0 {
			t.Errorf("Expected 0 unread notifications after marking all as read, got %d", count)
		}
	})

	t.Run("Hub user online status", func(t *testing.T) {
		userID := uuid.New()

		// User should not be online initially
		if hub.IsUserOnline(userID) {
			t.Error("Expected user to not be online initially")
		}

		// Mock connection
		connection := &notification.Connection{
			ID:     uuid.New(),
			UserID: userID,
			Send:   make(chan []byte, 10),
			Hub:    hub,
		}

		hub.RegisterConnection(connection)

		// Give time for registration
		// Note: In real scenario, we'd use proper synchronization
		// For testing, this is simplified

		// User should be online now
		if !hub.IsUserOnline(userID) {
			t.Error("Expected user to be online after registering connection")
		}

		// Get online user count
		count := hub.GetOnlineUserCount()
		if count == 0 {
			t.Error("Expected at least 1 online user")
		}

		hub.UnregisterConnection(connection)

		// User should be offline now
		if hub.IsUserOnline(userID) {
			t.Error("Expected user to be offline after unregistering connection")
		}
	})
}