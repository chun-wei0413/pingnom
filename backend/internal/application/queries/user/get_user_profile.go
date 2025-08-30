package user

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
)

type GetUserProfileQuery struct {
	UserID shared.UserID `json:"-"`
}

type UserProfileResult struct {
	ID              string                 `json:"id"`
	Email           string                 `json:"email"`
	PhoneNumber     string                 `json:"phoneNumber,omitempty"`
	Profile         user.UserProfile       `json:"profile"`
	Preferences     user.DietaryPreferences `json:"preferences"`
	PrivacySettings user.PrivacySettings   `json:"privacySettings"`
	IsActive        bool                   `json:"isActive"`
	IsVerified      bool                   `json:"isVerified"`
	CreatedAt       string                 `json:"createdAt"`
	UpdatedAt       string                 `json:"updatedAt"`
}

type GetUserProfileHandler struct {
	userRepo user.UserRepository
}

func NewGetUserProfileHandler(userRepo user.UserRepository) *GetUserProfileHandler {
	return &GetUserProfileHandler{
		userRepo: userRepo,
	}
}

func (h *GetUserProfileHandler) Handle(ctx context.Context, query GetUserProfileQuery) (*UserProfileResult, error) {
	user, err := h.userRepo.FindByID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}
	
	return &UserProfileResult{
		ID:              user.ID.String(),
		Email:           user.Email,
		PhoneNumber:     user.PhoneNumber,
		Profile:         user.Profile,
		Preferences:     user.Preferences,
		PrivacySettings: user.PrivacySettings,
		IsActive:        user.IsActive,
		IsVerified:      user.IsVerified,
		CreatedAt:       user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:       user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

type SearchUsersQuery struct {
	Query  string `json:"query"`
	Limit  int    `json:"limit" validate:"min=1,max=100"`
	Offset int    `json:"offset" validate:"min=0"`
}

type SearchUsersResult struct {
	Users []UserSearchResult `json:"users"`
	Total int                `json:"total"`
}

type UserSearchResult struct {
	ID          string           `json:"id"`
	Email       string           `json:"email"`
	DisplayName string           `json:"displayName"`
	Avatar      string           `json:"avatar,omitempty"`
	Bio         string           `json:"bio,omitempty"`
	IsVerified  bool             `json:"isVerified"`
}

type SearchUsersHandler struct {
	userService *user.UserService
}

func NewSearchUsersHandler(userService *user.UserService) *SearchUsersHandler {
	return &SearchUsersHandler{
		userService: userService,
	}
}

func (h *SearchUsersHandler) Handle(ctx context.Context, query SearchUsersQuery) (*SearchUsersResult, error) {
	users, err := h.userService.SearchDiscoverableUsers(ctx, query.Query, query.Limit, query.Offset)
	if err != nil {
		return nil, err
	}
	
	results := make([]UserSearchResult, len(users))
	for i, u := range users {
		results[i] = UserSearchResult{
			ID:          u.ID.String(),
			Email:       u.Email,
			DisplayName: u.Profile.DisplayName,
			Avatar:      u.Profile.Avatar,
			Bio:         u.Profile.Bio,
			IsVerified:  u.IsVerified,
		}
	}
	
	return &SearchUsersResult{
		Users: results,
		Total: len(results),
	}, nil
}