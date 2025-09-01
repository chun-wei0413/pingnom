package user

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
)

type UpdatePrivacyCommand struct {
	UserID             shared.UserID `json:"-"`
	IsDiscoverable     bool         `json:"isDiscoverable"`
	ShowLocation       bool         `json:"showLocation"`
	AllowFriendRequest bool         `json:"allowFriendRequest"`
}

type UpdatePrivacyHandler struct {
	userService *user.UserService
}

func NewUpdatePrivacyHandler(userService *user.UserService) *UpdatePrivacyHandler {
	return &UpdatePrivacyHandler{
		userService: userService,
	}
}

func (h *UpdatePrivacyHandler) Handle(ctx context.Context, cmd UpdatePrivacyCommand) error {
	settings := user.PrivacySettings{
		IsDiscoverable:     cmd.IsDiscoverable,
		ShowLocation:       cmd.ShowLocation,
		AllowFriendRequest: cmd.AllowFriendRequest,
	}
	
	return h.userService.UpdatePrivacySettings(ctx, cmd.UserID, settings)
}