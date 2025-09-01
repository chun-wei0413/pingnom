package friendship

import (
	"time"
	"errors"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// FriendshipStatus 代表好友關係狀態
type FriendshipStatus int

const (
	StatusPending  FriendshipStatus = iota // 等待回應
	StatusAccepted                         // 已接受
	StatusBlocked                          // 已封鎖
	StatusDeclined                         // 已拒絕
)

func (s FriendshipStatus) String() string {
	switch s {
	case StatusPending:
		return "pending"
	case StatusAccepted:
		return "accepted"
	case StatusBlocked:
		return "blocked"
	case StatusDeclined:
		return "declined"
	default:
		return "unknown"
	}
}

// Friendship 代表兩個用戶之間的好友關係
type Friendship struct {
	ID           shared.FriendshipID `json:"id"`
	RequesterID  shared.UserID       `json:"requesterId"`  // 發起好友邀請的用戶
	AddresseeID  shared.UserID       `json:"addresseeId"`  // 被邀請的用戶
	Status       FriendshipStatus    `json:"status"`
	Message      string              `json:"message,omitempty"` // 邀請訊息
	CreatedAt    time.Time           `json:"createdAt"`
	UpdatedAt    time.Time           `json:"updatedAt"`
	AcceptedAt   *time.Time          `json:"acceptedAt,omitempty"`
}

// NewFriendshipRequest 建立新的好友邀請
func NewFriendshipRequest(requesterID, addresseeID shared.UserID, message string) (*Friendship, error) {
	// 驗證不能邀請自己
	if requesterID == addresseeID {
		return nil, shared.ErrSelfFriendRequest
	}

	// 驗證邀請訊息長度
	if len(message) > 200 {
		return nil, errors.New("friendship request message too long")
	}

	now := time.Now()
	return &Friendship{
		ID:          shared.NewFriendshipID(),
		RequesterID: requesterID,
		AddresseeID: addresseeID,
		Status:      StatusPending,
		Message:     message,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Accept 接受好友邀請
func (f *Friendship) Accept() error {
	if f.Status != StatusPending {
		return errors.New("can only accept pending friend requests")
	}

	now := time.Now()
	f.Status = StatusAccepted
	f.AcceptedAt = &now
	f.UpdatedAt = now
	return nil
}

// Decline 拒絕好友邀請
func (f *Friendship) Decline() error {
	if f.Status != StatusPending {
		return errors.New("can only decline pending friend requests")
	}

	f.Status = StatusDeclined
	f.UpdatedAt = time.Now()
	return nil
}

// Block 封鎖用戶
func (f *Friendship) Block() error {
	f.Status = StatusBlocked
	f.UpdatedAt = time.Now()
	return nil
}

// Unblock 解除封鎖
func (f *Friendship) Unblock() error {
	if f.Status != StatusBlocked {
		return errors.New("friendship is not blocked")
	}

	// 解除封鎖後回到已接受狀態（如果之前是朋友）
	// 或者刪除關係（讓用戶可以重新邀請）
	f.Status = StatusDeclined // 設為已拒絕，允許重新邀請
	f.UpdatedAt = time.Now()
	return nil
}

// IsActive 檢查好友關係是否為活躍狀態
func (f *Friendship) IsActive() bool {
	return f.Status == StatusAccepted
}

// IsPending 檢查好友關係是否為待處理狀態
func (f *Friendship) IsPending() bool {
	return f.Status == StatusPending
}

// IsBlocked 檢查好友關係是否被封鎖
func (f *Friendship) IsBlocked() bool {
	return f.Status == StatusBlocked
}

// GetOtherUserID 根據給定的用戶 ID 獲取另一個用戶的 ID
func (f *Friendship) GetOtherUserID(userID shared.UserID) shared.UserID {
	if f.RequesterID == userID {
		return f.AddresseeID
	}
	return f.RequesterID
}

// IsRequester 檢查給定用戶是否為邀請發起者
func (f *Friendship) IsRequester(userID shared.UserID) bool {
	return f.RequesterID == userID
}