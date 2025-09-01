package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/auth"
)

type AuthMiddleware struct {
	jwtService *auth.JWTService
}

func NewAuthMiddleware(jwtService *auth.JWTService) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
	}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}
		
		// 檢查 Bearer token 格式
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}
		
		tokenString := parts[1]
		
		// 使用 JWT 服務驗證 token
		claims, err := m.jwtService.ValidateToken(tokenString)
		if err != nil {
			var errorMsg string
			switch err {
			case auth.ErrExpiredToken:
				errorMsg = "Token has expired"
			case auth.ErrInvalidToken:
				errorMsg = "Invalid token"
			default:
				errorMsg = "Token validation failed"
			}
			
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": errorMsg,
			})
			c.Abort()
			return
		}
		
		// 設置用戶資訊到 context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		
		c.Next()
	}
}