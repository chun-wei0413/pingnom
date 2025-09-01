package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	authcommands "github.com/chun-wei0413/pingnom/internal/application/commands/auth"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type AuthHandler struct {
	loginHandler *authcommands.LoginHandler
}

func NewAuthHandler(loginHandler *authcommands.LoginHandler) *AuthHandler {
	return &AuthHandler{
		loginHandler: loginHandler,
	}
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var cmd authcommands.LoginCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	result, err := h.loginHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		statusCode := http.StatusInternalServerError
		switch err {
		case shared.ErrInvalidCredentials:
			statusCode = http.StatusUnauthorized
		case shared.ErrUserNotFound:
			statusCode = http.StatusUnauthorized // 不要透露用戶不存在的資訊
		case shared.ErrUserInactive:
			statusCode = http.StatusForbidden
		default:
			statusCode = http.StatusInternalServerError
		}

		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data":    result,
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// 由於使用 JWT，logout 主要在前端處理（刪除 token）
	// 這裡可以記錄 logout 事件或將 token 加入黑名單（如果需要）
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// POST /api/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// 從 Authorization header 獲取當前 token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authorization header required",
		})
		return
	}

	// 這裡需要實作 refresh token 邏輯
	// 暫時回傳錯誤，因為 refresh 功能較複雜
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Token refresh not implemented yet",
	})
}