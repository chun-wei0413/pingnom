package inmemory

import (
	"context"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// InMemoryFriendshipRepository InMemory 實作的好友關係儲存庫
type InMemoryFriendshipRepository struct {
	mu          sync.RWMutex
	friendships map[string]*friendship.Friendship // key: FriendshipID
	userIndex   map[string][]string               // key: UserID, value: []FriendshipID
}

// NewInMemoryFriendshipRepository 建立新的 InMemory 好友關係儲存庫
func NewInMemoryFriendshipRepository() *InMemoryFriendshipRepository {
	return &InMemoryFriendshipRepository{
		friendships: make(map[string]*friendship.Friendship),
		userIndex:   make(map[string][]string),
	}
}

// Save 儲存好友關係
func (r *InMemoryFriendshipRepository) Save(ctx context.Context, f *friendship.Friendship) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	friendshipID := f.ID.String()
	r.friendships[friendshipID] = f

	// 更新用戶索引
	r.addToUserIndex(f.RequesterID.String(), friendshipID)
	r.addToUserIndex(f.AddresseeID.String(), friendshipID)

	return nil
}

// Update 更新好友關係
func (r *InMemoryFriendshipRepository) Update(ctx context.Context, f *friendship.Friendship) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	friendshipID := f.ID.String()
	if _, exists := r.friendships[friendshipID]; !exists {
		return shared.ErrEntityNotFound
	}

	r.friendships[friendshipID] = f
	return nil
}

// FindByID 根據 ID 查找好友關係
func (r *InMemoryFriendshipRepository) FindByID(ctx context.Context, id shared.FriendshipID) (*friendship.Friendship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	f, exists := r.friendships[id.String()]
	if !exists {
		return nil, shared.ErrEntityNotFound
	}

	return f, nil
}

// FindByUsers 查找兩個用戶之間的好友關係
func (r *InMemoryFriendshipRepository) FindByUsers(ctx context.Context, userID1, userID2 shared.UserID) (*friendship.Friendship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// 檢查 userID1 的所有好友關係
	friendshipIDs := r.userIndex[userID1.String()]
	for _, fID := range friendshipIDs {
		f := r.friendships[fID]
		if f != nil {
			if (f.RequesterID == userID1 && f.AddresseeID == userID2) ||
				(f.RequesterID == userID2 && f.AddresseeID == userID1) {
				return f, nil
			}
		}
	}

	return nil, shared.ErrEntityNotFound
}

// FindFriendsByUserID 獲取用戶的所有朋友
func (r *InMemoryFriendshipRepository) FindFriendsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*friendship.Friendship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var friends []*friendship.Friendship
	friendshipIDs := r.userIndex[userID.String()]

	for _, fID := range friendshipIDs {
		f := r.friendships[fID]
		if f != nil && f.IsActive() {
			friends = append(friends, f)
		}
	}

	// 應用分頁
	return r.applyPagination(friends, limit, offset), nil
}

// FindPendingRequestsByUserID 獲取用戶的待處理好友邀請（作為被邀請者）
func (r *InMemoryFriendshipRepository) FindPendingRequestsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*friendship.Friendship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var pendingRequests []*friendship.Friendship
	friendshipIDs := r.userIndex[userID.String()]

	for _, fID := range friendshipIDs {
		f := r.friendships[fID]
		if f != nil && f.IsPending() && f.AddresseeID == userID {
			pendingRequests = append(pendingRequests, f)
		}
	}

	// 應用分頁
	return r.applyPagination(pendingRequests, limit, offset), nil
}

// FindSentRequestsByUserID 獲取用戶發送的好友邀請（作為邀請者）
func (r *InMemoryFriendshipRepository) FindSentRequestsByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*friendship.Friendship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var sentRequests []*friendship.Friendship
	friendshipIDs := r.userIndex[userID.String()]

	for _, fID := range friendshipIDs {
		f := r.friendships[fID]
		if f != nil && f.IsPending() && f.RequesterID == userID {
			sentRequests = append(sentRequests, f)
		}
	}

	// 應用分頁
	return r.applyPagination(sentRequests, limit, offset), nil
}

// CountFriendsByUserID 計算用戶的朋友數量
func (r *InMemoryFriendshipRepository) CountFriendsByUserID(ctx context.Context, userID shared.UserID) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	count := 0
	friendshipIDs := r.userIndex[userID.String()]

	for _, fID := range friendshipIDs {
		f := r.friendships[fID]
		if f != nil && f.IsActive() {
			count++
		}
	}

	return count, nil
}

// ExistsBetweenUsers 檢查兩個用戶之間是否已存在好友關係（任何狀態）
func (r *InMemoryFriendshipRepository) ExistsBetweenUsers(ctx context.Context, userID1, userID2 shared.UserID) (bool, error) {
	_, err := r.FindByUsers(ctx, userID1, userID2)
	if err == shared.ErrEntityNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// Delete 刪除好友關係
func (r *InMemoryFriendshipRepository) Delete(ctx context.Context, id shared.FriendshipID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	friendshipID := id.String()
	f, exists := r.friendships[friendshipID]
	if !exists {
		return shared.ErrEntityNotFound
	}

	// 從用戶索引中移除
	r.removeFromUserIndex(f.RequesterID.String(), friendshipID)
	r.removeFromUserIndex(f.AddresseeID.String(), friendshipID)

	// 刪除好友關係
	delete(r.friendships, friendshipID)

	return nil
}

// addToUserIndex 將好友關係 ID 加入用戶索引
func (r *InMemoryFriendshipRepository) addToUserIndex(userID, friendshipID string) {
	if r.userIndex[userID] == nil {
		r.userIndex[userID] = make([]string, 0)
	}
	
	// 檢查是否已存在
	for _, existingID := range r.userIndex[userID] {
		if existingID == friendshipID {
			return
		}
	}
	
	r.userIndex[userID] = append(r.userIndex[userID], friendshipID)
}

// removeFromUserIndex 從用戶索引中移除好友關係 ID
func (r *InMemoryFriendshipRepository) removeFromUserIndex(userID, friendshipID string) {
	friendshipIDs := r.userIndex[userID]
	for i, id := range friendshipIDs {
		if id == friendshipID {
			r.userIndex[userID] = append(friendshipIDs[:i], friendshipIDs[i+1:]...)
			break
		}
	}
}

// applyPagination 應用分頁邏輯
func (r *InMemoryFriendshipRepository) applyPagination(items []*friendship.Friendship, limit, offset int) []*friendship.Friendship {
	if offset >= len(items) {
		return []*friendship.Friendship{}
	}

	end := offset + limit
	if end > len(items) {
		end = len(items)
	}

	return items[offset:end]
}