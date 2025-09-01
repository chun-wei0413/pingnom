package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type GetSentRequestsQuery struct {
	UserID shared.UserID `json:"userId" validate:"required"`
	Limit  int           `json:"limit,omitempty"`
	Offset int           `json:"offset,omitempty"`
}

type GetSentRequestsHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewGetSentRequestsHandler(friendshipService *friendship.FriendshipService) *GetSentRequestsHandler {
	return &GetSentRequestsHandler{
		friendshipService: friendshipService,
	}
}

func (h *GetSentRequestsHandler) Handle(ctx context.Context, query GetSentRequestsQuery) ([]*friendship.Friendship, error) {
	limit := query.Limit
	if limit == 0 {
		limit = 50 // 預設限制
	}
	
	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	return h.friendshipService.GetSentRequests(ctx, query.UserID, limit, offset)
}