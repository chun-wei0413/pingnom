package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type GetFriendsQuery struct {
	UserID shared.UserID `json:"userId" validate:"required"`
	Limit  int           `json:"limit,omitempty"`
	Offset int           `json:"offset,omitempty"`
}

type GetFriendsHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewGetFriendsHandler(friendshipService *friendship.FriendshipService) *GetFriendsHandler {
	return &GetFriendsHandler{
		friendshipService: friendshipService,
	}
}

func (h *GetFriendsHandler) Handle(ctx context.Context, query GetFriendsQuery) ([]*friendship.Friendship, error) {
	limit := query.Limit
	if limit == 0 {
		limit = 50 // 預設限制
	}
	
	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	return h.friendshipService.GetFriends(ctx, query.UserID, limit, offset)
}