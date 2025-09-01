package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type DeclineFriendRequestCommand struct {
	AddresseeID  shared.UserID       `json:"addresseeId" validate:"required"`
	FriendshipID shared.FriendshipID `json:"friendshipId" validate:"required"`
}

type DeclineFriendRequestHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewDeclineFriendRequestHandler(friendshipService *friendship.FriendshipService) *DeclineFriendRequestHandler {
	return &DeclineFriendRequestHandler{
		friendshipService: friendshipService,
	}
}

func (h *DeclineFriendRequestHandler) Handle(ctx context.Context, cmd DeclineFriendRequestCommand) error {
	return h.friendshipService.DeclineFriendRequest(ctx, cmd.AddresseeID, cmd.FriendshipID)
}