package friendship

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type BlockUserCommand struct {
	BlockerID shared.UserID `json:"blockerId" validate:"required"`
	BlockedID shared.UserID `json:"blockedId" validate:"required"`
}

type BlockUserHandler struct {
	friendshipService *friendship.FriendshipService
}

func NewBlockUserHandler(friendshipService *friendship.FriendshipService) *BlockUserHandler {
	return &BlockUserHandler{
		friendshipService: friendshipService,
	}
}

func (h *BlockUserHandler) Handle(ctx context.Context, cmd BlockUserCommand) error {
	return h.friendshipService.BlockUser(ctx, cmd.BlockerID, cmd.BlockedID)
}