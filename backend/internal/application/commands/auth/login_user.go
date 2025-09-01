package auth

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
)

type LoginCommand struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginResult struct {
	AccessToken string               `json:"accessToken"`
	TokenType   string               `json:"tokenType"`
	ExpiresIn   int64                `json:"expiresIn"`
	User        *user.UserProfile    `json:"user"`
}

type LoginHandler struct {
	userService *user.UserService
	jwtService  *auth.JWTService
}

func NewLoginHandler(userService *user.UserService, jwtService *auth.JWTService) *LoginHandler {
	return &LoginHandler{
		userService: userService,
		jwtService:  jwtService,
	}
}

func (h *LoginHandler) Handle(ctx context.Context, cmd LoginCommand) (*LoginResult, error) {
	// 根據 Email 查找用戶
	foundUser, err := h.userService.GetUserByEmail(ctx, cmd.Email)
	if err != nil {
		if err == shared.ErrUserNotFound {
			return nil, shared.ErrInvalidCredentials
		}
		return nil, err
	}

	// 驗證密碼
	if !foundUser.VerifyPassword(cmd.Password) {
		return nil, shared.ErrInvalidCredentials
	}

	// 檢查用戶狀態
	if !foundUser.IsActive {
		return nil, shared.ErrUserInactive
	}

	// 生成 JWT Token
	token, err := h.jwtService.GenerateToken(foundUser.ID, foundUser.Email)
	if err != nil {
		return nil, err
	}

	// 建立用戶檔案
	profile := &foundUser.Profile

	return &LoginResult{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   24 * 60 * 60, // 24 hours in seconds
		User:        profile,
	}, nil
}