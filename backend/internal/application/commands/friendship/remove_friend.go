package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type RemoveFriendCommand struct {
	UserID   shared.UserID `json:"userId" validate:"required"`
	FriendID shared.UserID `json:"friendId" validate:"required"`
}

type RemoveFriendHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewRemoveFriendHandler(friendshipService *friendship.FriendshipService) *RemoveFriendHandler {
	return &RemoveFriendHandler{
		friendshipService: friendshipService,
	}
}

func (h *RemoveFriendHandler) Handle(ctx context.Context, cmd RemoveFriendCommand) error {
	return h.friendshipService.RemoveFriend(ctx, cmd.UserID, cmd.FriendID)
}