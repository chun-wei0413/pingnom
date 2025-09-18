package notification

import (
	"context"

	"github.com/google/uuid"
)

// Repository 定義通知儲存庫介面
type Repository interface {
	// Create 創建新通知
	Create(ctx context.Context, notification *Notification) error

	// GetByID 根據 ID 獲取通知
	GetByID(ctx context.Context, id uuid.UUID) (*Notification, error)

	// GetByReceiverID 獲取用戶的所有通知
	GetByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*Notification, error)

	// GetUnreadByReceiverID 獲取用戶的未讀通知
	GetUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID, limit, offset int) ([]*Notification, error)

	// CountUnreadByReceiverID 計算用戶未讀通知數量
	CountUnreadByReceiverID(ctx context.Context, receiverID uuid.UUID) (int, error)

	// Update 更新通知
	Update(ctx context.Context, notification *Notification) error

	// MarkAsRead 標記通知為已讀
	MarkAsRead(ctx context.Context, id uuid.UUID) error

	// MarkAllAsRead 標記用戶所有通知為已讀
	MarkAllAsRead(ctx context.Context, receiverID uuid.UUID) error

	// Delete 刪除通知
	Delete(ctx context.Context, id uuid.UUID) error

	// DeleteOld 刪除舊通知（清理用）
	DeleteOld(ctx context.Context, days int) error
}