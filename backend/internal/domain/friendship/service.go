package friendship

import (
	"context"
	"errors"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// FriendshipService 處理好友關係相關的業務邏輯
type FriendshipService struct {
	friendshipRepo FriendshipRepository
}

// NewFriendshipService 建立新的好友服務
func NewFriendshipService(friendshipRepo FriendshipRepository) *FriendshipService {
	return &FriendshipService{
		friendshipRepo: friendshipRepo,
	}
}

// SendFriendRequest 發送好友邀請
func (s *FriendshipService) SendFriendRequest(ctx context.Context, requesterID, addresseeID shared.UserID, message string) (*Friendship, error) {
	// 檢查是否已存在好友關係
	existingFriendship, err := s.friendshipRepo.FindByUsers(ctx, requesterID, addresseeID)
	if err != nil && err != shared.ErrEntityNotFound {
		return nil, err
	}

	if existingFriendship != nil {
		switch existingFriendship.Status {
		case StatusAccepted:
			return nil, shared.ErrFriendshipExists
		case StatusPending:
			if existingFriendship.IsRequester(requesterID) {
				return nil, errors.New("friend request already sent")
			}
			return nil, errors.New("friend request already received from this user")
		case StatusBlocked:
			return nil, errors.New("cannot send friend request to blocked user")
		case StatusDeclined:
			// 允許重新發送邀請，但先刪除舊記錄
			if err := s.friendshipRepo.Delete(ctx, existingFriendship.ID); err != nil {
				return nil, err
			}
		}
	}

	// 建立新的好友邀請
	friendship, err := NewFriendshipRequest(requesterID, addresseeID, message)
	if err != nil {
		return nil, err
	}

	if err := s.friendshipRepo.Save(ctx, friendship); err != nil {
		return nil, err
	}

	return friendship, nil
}

// AcceptFriendRequest 接受好友邀請
func (s *FriendshipService) AcceptFriendRequest(ctx context.Context, addresseeID shared.UserID, friendshipID shared.FriendshipID) error {
	friendship, err := s.friendshipRepo.FindByID(ctx, friendshipID)
	if err != nil {
		return err
	}

	// 驗證只有被邀請者可以接受邀請
	if friendship.AddresseeID != addresseeID {
		return errors.New("only the addressee can accept the friend request")
	}

	if err := friendship.Accept(); err != nil {
		return err
	}

	return s.friendshipRepo.Update(ctx, friendship)
}

// DeclineFriendRequest 拒絕好友邀請
func (s *FriendshipService) DeclineFriendRequest(ctx context.Context, addresseeID shared.UserID, friendshipID shared.FriendshipID) error {
	friendship, err := s.friendshipRepo.FindByID(ctx, friendshipID)
	if err != nil {
		return err
	}

	// 驗證只有被邀請者可以拒絕邀請
	if friendship.AddresseeID != addresseeID {
		return errors.New("only the addressee can decline the friend request")
	}

	if err := friendship.Decline(); err != nil {
		return err
	}

	return s.friendshipRepo.Update(ctx, friendship)
}

// BlockUser 封鎖用戶
func (s *FriendshipService) BlockUser(ctx context.Context, blockerID, blockedID shared.UserID) error {
	// 檢查是否已存在好友關係
	friendship, err := s.friendshipRepo.FindByUsers(ctx, blockerID, blockedID)
	if err != nil && err != shared.ErrEntityNotFound {
		return err
	}

	if friendship == nil {
		// 如果沒有現有關係，建立一個新的封鎖關係
		friendship, err = NewFriendshipRequest(blockerID, blockedID, "")
		if err != nil {
			return err
		}
		friendship.Status = StatusBlocked
		return s.friendshipRepo.Save(ctx, friendship)
	}

	// 更新現有關係為封鎖狀態
	if err := friendship.Block(); err != nil {
		return err
	}

	return s.friendshipRepo.Update(ctx, friendship)
}

// UnblockUser 解除封鎖用戶
func (s *FriendshipService) UnblockUser(ctx context.Context, unblockerID, unblockedID shared.UserID) error {
	friendship, err := s.friendshipRepo.FindByUsers(ctx, unblockerID, unblockedID)
	if err != nil {
		return err
	}

	if err := friendship.Unblock(); err != nil {
		return err
	}

	return s.friendshipRepo.Update(ctx, friendship)
}

// RemoveFriend 移除朋友關係
func (s *FriendshipService) RemoveFriend(ctx context.Context, userID, friendID shared.UserID) error {
	friendship, err := s.friendshipRepo.FindByUsers(ctx, userID, friendID)
	if err != nil {
		return err
	}

	if !friendship.IsActive() {
		return errors.New("users are not friends")
	}

	return s.friendshipRepo.Delete(ctx, friendship.ID)
}

// GetFriends 獲取用戶的朋友列表
func (s *FriendshipService) GetFriends(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error) {
	return s.friendshipRepo.FindFriendsByUserID(ctx, userID, limit, offset)
}

// GetPendingRequests 獲取待處理的好友邀請
func (s *FriendshipService) GetPendingRequests(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error) {
	return s.friendshipRepo.FindPendingRequestsByUserID(ctx, userID, limit, offset)
}

// GetSentRequests 獲取發送的好友邀請
func (s *FriendshipService) GetSentRequests(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Friendship, error) {
	return s.friendshipRepo.FindSentRequestsByUserID(ctx, userID, limit, offset)
}

// AreFriends 檢查兩個用戶是否為朋友
func (s *FriendshipService) AreFriends(ctx context.Context, userID1, userID2 shared.UserID) (bool, error) {
	friendship, err := s.friendshipRepo.FindByUsers(ctx, userID1, userID2)
	if err != nil {
		if err == shared.ErrEntityNotFound {
			return false, nil
		}
		return false, err
	}

	return friendship.IsActive(), nil
}

// GetFriendCount 獲取朋友數量
func (s *FriendshipService) GetFriendCount(ctx context.Context, userID shared.UserID) (int, error) {
	return s.friendshipRepo.CountFriendsByUserID(ctx, userID)
}