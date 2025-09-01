package user

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
)

type UpdatePreferencesCommand struct {
	UserID       shared.UserID `json:"-"`
	CuisineTypes []string      `json:"cuisineTypes,omitempty" validate:"max=20"`
	Restrictions []string      `json:"restrictions,omitempty" validate:"max=10"`
	MinPrice     int          `json:"minPrice" validate:"min=0"`
	MaxPrice     int          `json:"maxPrice" validate:"min=0"`
}

type UpdatePreferencesHandler struct {
	userService *user.UserService
}

func NewUpdatePreferencesHandler(userService *user.UserService) *UpdatePreferencesHandler {
	return &UpdatePreferencesHandler{
		userService: userService,
	}
}

func (h *UpdatePreferencesHandler) Handle(ctx context.Context, cmd UpdatePreferencesCommand) error {
	preferences, err := user.NewDietaryPreferences(
		cmd.CuisineTypes,
		cmd.Restrictions,
		cmd.MinPrice,
		cmd.MaxPrice,
	)
	if err != nil {
		return err
	}
	
	return h.userService.UpdateUserPreferences(ctx, cmd.UserID, preferences)
}