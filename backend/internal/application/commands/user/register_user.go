package user

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
)

type RegisterUserCommand struct {
	Email       string `json:"email" validate:"required,email"`
	PhoneNumber string `json:"phoneNumber,omitempty" validate:"omitempty,e164"`
	Password    string `json:"password" validate:"required,min=8"`
	DisplayName string `json:"displayName" validate:"required,min=1,max=100"`
}

type RegisterUserResult struct {
	UserID      string `json:"userId"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	IsVerified  bool   `json:"isVerified"`
	CreatedAt   string `json:"createdAt"`
}

type RegisterUserHandler struct {
	userService *user.UserService
}

func NewRegisterUserHandler(userService *user.UserService) *RegisterUserHandler {
	return &RegisterUserHandler{
		userService: userService,
	}
}

func (h *RegisterUserHandler) Handle(ctx context.Context, cmd RegisterUserCommand) (*RegisterUserResult, error) {
	// 透過 Domain Service 處理註冊邏輯
	newUser, err := h.userService.RegisterUser(ctx, cmd.Email, cmd.PhoneNumber, cmd.Password, cmd.DisplayName)
	if err != nil {
		return nil, err
	}
	
	return &RegisterUserResult{
		UserID:      newUser.ID.String(),
		Email:       newUser.Email,
		DisplayName: newUser.Profile.DisplayName,
		IsVerified:  newUser.IsVerified,
		CreatedAt:   newUser.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

type UpdateProfileCommand struct {
	UserID           shared.UserID         `json:"-"`
	DisplayName      string                `json:"displayName" validate:"required,min=1,max=100"`
	Avatar          string                `json:"avatar,omitempty"`
	Bio             string                `json:"bio,omitempty" validate:"max=500"`
	DefaultLocations []shared.Location     `json:"defaultLocations,omitempty" validate:"max=5"`
}

type UpdateProfileHandler struct {
	userService *user.UserService
}

func NewUpdateProfileHandler(userService *user.UserService) *UpdateProfileHandler {
	return &UpdateProfileHandler{
		userService: userService,
	}
}

func (h *UpdateProfileHandler) Handle(ctx context.Context, cmd UpdateProfileCommand) error {
	profile, err := user.NewUserProfile(cmd.DisplayName, cmd.Avatar, cmd.Bio, cmd.DefaultLocations)
	if err != nil {
		return err
	}
	
	return h.userService.UpdateUserProfile(ctx, cmd.UserID, profile)
}

type ChangePasswordCommand struct {
	UserID      shared.UserID `json:"-"`
	OldPassword string        `json:"oldPassword" validate:"required"`
	NewPassword string        `json:"newPassword" validate:"required,min=8"`
}

type ChangePasswordHandler struct {
	userService *user.UserService
}

func NewChangePasswordHandler(userService *user.UserService) *ChangePasswordHandler {
	return &ChangePasswordHandler{
		userService: userService,
	}
}

func (h *ChangePasswordHandler) Handle(ctx context.Context, cmd ChangePasswordCommand) error {
	return h.userService.ChangePassword(ctx, cmd.UserID, cmd.OldPassword, cmd.NewPassword)
}