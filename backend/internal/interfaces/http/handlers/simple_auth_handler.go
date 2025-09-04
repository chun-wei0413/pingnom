package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
)

type SimpleAuthHandler struct {
	userService *user.UserService
	jwtService  *auth.JWTService
}

func NewSimpleAuthHandler(userService *user.UserService, jwtService *auth.JWTService) *SimpleAuthHandler {
	return &SimpleAuthHandler{
		userService: userService,
		jwtService:  jwtService,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string    `json:"token"`
	User  UserInfo  `json:"user"`
}

type UserInfo struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
}

func (h *SimpleAuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// 使用 UserService 驗證用戶
	user, err := h.userService.AuthenticateUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// 生成 JWT token
	token, err := h.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// 回傳成功回應
	response := AuthResponse{
		Token: token,
		User: UserInfo{
			ID:          user.ID.String(),
			Email:       user.Email,
			DisplayName: user.Profile.DisplayName,
		},
	}

	c.JSON(http.StatusOK, response)
}