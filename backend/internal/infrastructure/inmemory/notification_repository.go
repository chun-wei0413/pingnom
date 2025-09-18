package inmemory

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/notification"
)

// NotificationRepository InMemory 通知儲存庫實作
type NotificationRepository struct {
	notifications map[uuid.UUID]*notification.Notification
	userIndex     map[uuid.UUID][]uuid.UUID // userID -> []notificationID
	mutex         sync.RWMutex
}

// NewNotificationRepository 創建新的通知儲存庫
func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{
		notifications: make(map[uuid.UUID]*notification.Notification),
		userIndex:     make(map[uuid.UUID][]uuid.UUID),
	}
}

// Create 創建新通知
func (r *NotificationRepository) Create(ctx context.Context, notif *notification.Notification) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// 保存通知
	r.notifications[notif.ID] = notif

	// 更新用戶索引
	if r.userIndex[notif.ReceiverID] == nil {
		r.userIndex[notif.ReceiverID] = make([]uuid.UUID, 0)
	}
	r.userIndex[notif.ReceiverID] = append(r.userIndex[notif.ReceiverID], notif.ID)

	// 按時間排序（最新的在前）
	sort.Slice(r.userIndex[notif.ReceiverID], func(i, j int) bool {
		id1, id2 := r.userIndex[notif.ReceiverID][i], r.userIndex[notif.ReceiverID][j]
		notif1, notif2 := r.notifications[id1], r.notifications[id2]
		return notif1.CreatedAt.After(notif2.CreatedAt)
	})

	return nil
}

// GetByID 根據 ID 獲取通知
func (r *NotificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*notification.Notification, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	notif, exists := r.notifications[id]
	if !exists {
		return nil, notification.ErrNotificationNotFound
	}

	return r.copyNotification(notif), nil
}

// GetByReceiverID 獲取用戶的所有通知
func (r *NotificationRepository) GetByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	notificationIDs, exists := r.userIndex[receiverID]
	if !exists {
		return []*notification.Notification{}, nil
	}

	// 應用分頁
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
		if notif, exists := r.notifications[notificationIDs[i]]; exists {
			result = append(result, r.copyNotification(notif))
		}
	}

	return result, nil
}

// GetUnreadByReceiverID 獲取用戶的未讀通知
func (r *NotificationRepository) GetUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*notification.Notification, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	notificationIDs, exists := r.userIndex[receiverID]
	if !exists {
		return []*notification.Notification{}, nil
	}

	// 過濾未讀通知
	unreadIDs := make([]uuid.UUID, 0)
	for _, id := range notificationIDs {
		if notif, exists := r.notifications[id]; exists && notif.IsUnread() {
			unreadIDs = append(unreadIDs, id)
		}
	}

	// 應用分頁
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
		if notif, exists := r.notifications[unreadIDs[i]]; exists {
			result = append(result, r.copyNotification(notif))
		}
	}

	return result, nil
}

// CountUnreadByReceiverID 計算用戶未讀通知數量
func (r *NotificationRepository) CountUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID) (int, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	notificationIDs, exists := r.userIndex[receiverID]
	if !exists {
		return 0, nil
	}

	count := 0
	for _, id := range notificationIDs {
		if notif, exists := r.notifications[id]; exists && notif.IsUnread() {
			count++
		}
	}

	return count, nil
}

// Update 更新通知
func (r *NotificationRepository) Update(ctx context.Context, notif *notification.Notification) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.notifications[notif.ID]; !exists {
		return notification.ErrNotificationNotFound
	}

	notif.UpdatedAt = time.Now()
	r.notifications[notif.ID] = notif

	return nil
}

// MarkAsRead 標記通知為已讀
func (r *NotificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	notif, exists := r.notifications[id]
	if !exists {
		return notification.ErrNotificationNotFound
	}

	notif.MarkAsRead()
	return nil
}

// MarkAllAsRead 標記用戶所有通知為已讀
func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, receiverID uuid.UUID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	notificationIDs, exists := r.userIndex[receiverID]
	if !exists {
		return nil
	}

	for _, id := range notificationIDs {
		if notif, exists := r.notifications[id]; exists && notif.IsUnread() {
			notif.MarkAsRead()
		}
	}

	return nil
}

// Delete 刪除通知
func (r *NotificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	notif, exists := r.notifications[id]
	if !exists {
		return notification.ErrNotificationNotFound
	}

	// 從通知映射中刪除
	delete(r.notifications, id)

	// 從用戶索引中刪除
	if notificationIDs, exists := r.userIndex[notif.ReceiverID]; exists {
		for i, notifID := range notificationIDs {
			if notifID == id {
				r.userIndex[notif.ReceiverID] = append(notificationIDs[:i], notificationIDs[i+1:]...)
				break
			}
		}
	}

	return nil
}

// DeleteOld 刪除舊通知（清理用）
func (r *NotificationRepository) DeleteOld(ctx context.Context, days int) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	cutoffTime := time.Now().AddDate(0, 0, -days)
	toDelete := make([]uuid.UUID, 0)

	// 找出需要刪除的通知
	for id, notif := range r.notifications {
		if notif.CreatedAt.Before(cutoffTime) {
			toDelete = append(toDelete, id)
		}
	}

	// 刪除舊通知
	for _, id := range toDelete {
		if notif, exists := r.notifications[id]; exists {
			delete(r.notifications, id)

			// 從用戶索引中刪除
			if notificationIDs, exists := r.userIndex[notif.ReceiverID]; exists {
				for i, notifID := range notificationIDs {
					if notifID == id {
						r.userIndex[notif.ReceiverID] = append(notificationIDs[:i], notificationIDs[i+1:]...)
						break
					}
				}
			}
		}
	}

	return nil
}

// copyNotification 複製通知以避免外部修改
func (r *NotificationRepository) copyNotification(original *notification.Notification) *notification.Notification {
	copy := *original

	// 深拷貝 Data map
	if original.Data != nil {
		copy.Data = make(map[string]any)
		for k, v := range original.Data {
			copy.Data[k] = v
		}
	}

	return &copy
}