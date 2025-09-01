package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type AcceptFriendRequestCommand struct {
	AddresseeID  shared.UserID       `json:"addresseeId" validate:"required"`
	FriendshipID shared.FriendshipID `json:"friendshipId" validate:"required"`
}

type AcceptFriendRequestHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewAcceptFriendRequestHandler(friendshipService *friendship.FriendshipService) *AcceptFriendRequestHandler {
	return &AcceptFriendRequestHandler{
		friendshipService: friendshipService,
	}
}

func (h *AcceptFriendRequestHandler) Handle(ctx context.Context, cmd AcceptFriendRequestCommand) error {
	return h.friendshipService.AcceptFriendRequest(ctx, cmd.AddresseeID, cmd.FriendshipID)
}