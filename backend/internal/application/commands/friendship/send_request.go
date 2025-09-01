package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type SendFriendRequestCommand struct {
	RequesterID shared.UserID `json:"requesterId" validate:"required"`
	AddresseeID shared.UserID `json:"addresseeId" validate:"required"`
	Message     string        `json:"message,omitempty"`
}

type SendFriendRequestHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewSendFriendRequestHandler(friendshipService *friendship.FriendshipService) *SendFriendRequestHandler {
	return &SendFriendRequestHandler{
		friendshipService: friendshipService,
	}
}

func (h *SendFriendRequestHandler) Handle(ctx context.Context, cmd SendFriendRequestCommand) (*friendship.Friendship, error) {
	return h.friendshipService.SendFriendRequest(ctx, cmd.RequesterID, cmd.AddresseeID, cmd.Message)
}