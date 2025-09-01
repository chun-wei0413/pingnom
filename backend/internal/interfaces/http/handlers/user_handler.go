package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	usercommands "github.com/chun-wei0413/pingnom/internal/application/commands/user"
	userqueries "github.com/chun-wei0413/pingnom/internal/application/queries/user"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type UserHandler struct {
	registerUserHandler      *usercommands.RegisterUserHandler
	updateProfileHandler     *usercommands.UpdateProfileHandler
	updatePreferencesHandler *usercommands.UpdatePreferencesHandler
	updatePrivacyHandler     *usercommands.UpdatePrivacyHandler
	changePasswordHandler    *usercommands.ChangePasswordHandler
	getUserProfileHandler    *userqueries.GetUserProfileHandler
	searchUsersHandler       *userqueries.SearchUsersHandler
}

func NewUserHandler(
	registerUserHandler *usercommands.RegisterUserHandler,
	updateProfileHandler *usercommands.UpdateProfileHandler,
	updatePreferencesHandler *usercommands.UpdatePreferencesHandler,
	updatePrivacyHandler *usercommands.UpdatePrivacyHandler,
	changePasswordHandler *usercommands.ChangePasswordHandler,
	getUserProfileHandler *userqueries.GetUserProfileHandler,
	searchUsersHandler *userqueries.SearchUsersHandler,
) *UserHandler {
	return &UserHandler{
		registerUserHandler:      registerUserHandler,
		updateProfileHandler:     updateProfileHandler,
		updatePreferencesHandler: updatePreferencesHandler,
		updatePrivacyHandler:     updatePrivacyHandler,
		changePasswordHandler:    changePasswordHandler,
		getUserProfileHandler:    getUserProfileHandler,
		searchUsersHandler:       searchUsersHandler,
	}
}

// POST /api/users/register
func (h *UserHandler) Register(c *gin.Context) {
	var cmd usercommands.RegisterUserCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}
	
	result, err := h.registerUserHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		// 根據錯誤類型回傳適當的狀態碼
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserAlreadyExists {
			statusCode = http.StatusConflict
		} else if err == shared.ErrInvalidEmail || err == shared.ErrInvalidPhone || err == shared.ErrWeakPassword {
			statusCode = http.StatusBadRequest
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"data": result,
	})
}

// GET /api/users/profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := h.getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	
	query := userqueries.GetUserProfileQuery{
		UserID: userID,
	}
	
	result, err := h.getUserProfileHandler.Handle(c.Request.Context(), query)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserNotFound {
			statusCode = http.StatusNotFound
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

// PUT /api/users/profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := h.getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	
	var cmd usercommands.UpdateProfileCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}
	
	cmd.UserID = userID
	
	if err := h.updateProfileHandler.Handle(c.Request.Context(), cmd); err != nil {
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserNotFound {
			statusCode = http.StatusNotFound
		} else if err == shared.ErrInvalidInput {
			statusCode = http.StatusBadRequest
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
	})
}

// PUT /api/users/password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, err := h.getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	
	var cmd usercommands.ChangePasswordCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}
	
	cmd.UserID = userID
	
	if err := h.changePasswordHandler.Handle(c.Request.Context(), cmd); err != nil {
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserNotFound {
			statusCode = http.StatusNotFound
		} else if err == shared.ErrWeakPassword {
			statusCode = http.StatusBadRequest
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}

// PUT /api/users/preferences
func (h *UserHandler) UpdatePreferences(c *gin.Context) {
	userID, err := h.getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	
	var cmd usercommands.UpdatePreferencesCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}
	
	cmd.UserID = userID
	
	if err := h.updatePreferencesHandler.Handle(c.Request.Context(), cmd); err != nil {
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserNotFound {
			statusCode = http.StatusNotFound
		} else if err == shared.ErrInvalidInput {
			statusCode = http.StatusBadRequest
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Preferences updated successfully",
	})
}

// PUT /api/users/privacy
func (h *UserHandler) UpdatePrivacy(c *gin.Context) {
	userID, err := h.getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	
	var cmd usercommands.UpdatePrivacyCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}
	
	cmd.UserID = userID
	
	if err := h.updatePrivacyHandler.Handle(c.Request.Context(), cmd); err != nil {
		statusCode := http.StatusInternalServerError
		if err == shared.ErrUserNotFound {
			statusCode = http.StatusNotFound
		}
		
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Privacy settings updated successfully",
	})
}

// GET /api/users/search
func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 20
	}
	
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}
	
	searchQuery := userqueries.SearchUsersQuery{
		Query:  query,
		Limit:  limit,
		Offset: offset,
	}
	
	result, err := h.searchUsersHandler.Handle(c.Request.Context(), searchQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

// Helper method to extract user ID from JWT token
func (h *UserHandler) getUserIDFromContext(c *gin.Context) (shared.UserID, error) {
	// 開發模式：從 Header 中取得 X-User-ID 進行測試
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr != "" {
		return shared.NewUserIDFromString(userIDStr)
	}
	
	// JWT 模式（未來實作）
	userIDFromJWT, exists := c.Get("userID")
	if exists {
		return shared.NewUserIDFromString(userIDFromJWT.(string))
	}
	
	return shared.UserID{}, shared.ErrUnauthorized
}