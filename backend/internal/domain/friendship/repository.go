package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// FriendshipRepository 定義好友關係的儲存介面
type FriendshipRepository interface {
	// Save 儲存好友關係
	Save(ctx context.Context, friendship *Friendship) error

	// Update 更新好友關係
	Update(ctx context.Context, friendship *Friendship) error

	// FindByID 根據 ID 查找好友關係
	FindByID(ctx context.Context, id shared.FriendshipID) (*Friendship, error)

	// FindByUsers 查找兩個用戶之間的好友關係
	FindByUsers(ctx context.Context, userID1, userID2 shared.UserID) (*Friendship, error)

	// FindFriendsByUserID 獲取用戶的所有朋友
	FindFriendsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error)

	// FindPendingRequestsByUserID 獲取用戶的待處理好友邀請（作為被邀請者）
	FindPendingRequestsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error)

	// FindSentRequestsByUserID 獲取用戶發送的好友邀請（作為邀請者）
	FindSentRequestsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error)

	// CountFriendsByUserID 計算用戶的朋友數量
	CountFriendsByUserID(ctx context.Context, userID shared.UserID) (int, error)

	// ExistsBetweenUsers 檢查兩個用戶之間是否已存在好友關係（任何狀態）
	ExistsBetweenUsers(ctx context.Context, userID1, userID2 shared.UserID) (bool, error)

	// Delete 刪除好友關係
	Delete(ctx context.Context, id shared.FriendshipID) error
}