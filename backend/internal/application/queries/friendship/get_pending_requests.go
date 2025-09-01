package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type GetPendingRequestsQuery struct {
	UserID shared.UserID `json:"userId" validate:"required"`
	Limit  int           `json:"limit,omitempty"`
	Offset int           `json:"offset,omitempty"`
}

type GetPendingRequestsHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewGetPendingRequestsHandler(friendshipService *friendship.FriendshipService) *GetPendingRequestsHandler {
	return &GetPendingRequestsHandler{
		friendshipService: friendshipService,
	}
}

func (h *GetPendingRequestsHandler) Handle(ctx context.Context, query GetPendingRequestsQuery) ([]*friendship.Friendship, error) {
	limit := query.Limit
	if limit == 0 {
		limit = 50 // 預設限制
	}
	
	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	return h.friendshipService.GetPendingRequests(ctx, query.UserID, limit, offset)
}