package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	friendshipCommands "github.com/chun-wei0413/pingnom/internal/application/commands/friendship"
	friendshipQueries "github.com/chun-wei0413/pingnom/internal/application/queries/friendship"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// FriendshipHandler 好友關係 HTTP 處理器
type FriendshipHandler struct {
	sendRequestHandler    *friendshipCommands.SendFriendRequestHandler
	acceptRequestHandler  *friendshipCommands.AcceptFriendRequestHandler
	declineRequestHandler *friendshipCommands.DeclineFriendRequestHandler
	blockUserHandler      *friendshipCommands.BlockUserHandler
	removeFriendHandler   *friendshipCommands.RemoveFriendHandler
	getFriendsHandler     *friendshipQueries.GetFriendsHandler
	getPendingHandler     *friendshipQueries.GetPendingRequestsHandler
	getSentHandler        *friendshipQueries.GetSentRequestsHandler
}

// NewFriendshipHandler 建立新的好友關係處理器
func NewFriendshipHandler(
	sendRequestHandler *friendshipCommands.SendFriendRequestHandler,
	acceptRequestHandler *friendshipCommands.AcceptFriendRequestHandler,
	declineRequestHandler *friendshipCommands.DeclineFriendRequestHandler,
	blockUserHandler *friendshipCommands.BlockUserHandler,
	removeFriendHandler *friendshipCommands.RemoveFriendHandler,
	getFriendsHandler *friendshipQueries.GetFriendsHandler,
	getPendingHandler *friendshipQueries.GetPendingRequestsHandler,
	getSentHandler *friendshipQueries.GetSentRequestsHandler,
) *FriendshipHandler {
	return &FriendshipHandler{
		sendRequestHandler:    sendRequestHandler,
		acceptRequestHandler:  acceptRequestHandler,
		declineRequestHandler: declineRequestHandler,
		blockUserHandler:      blockUserHandler,
		removeFriendHandler:   removeFriendHandler,
		getFriendsHandler:     getFriendsHandler,
		getPendingHandler:     getPendingHandler,
		getSentHandler:        getSentHandler,
	}
}

// SendFriendRequest 發送好友邀請
func (h *FriendshipHandler) SendFriendRequest(c *gin.Context) {
	var req struct {
		AddresseeID string `json:"addresseeId" validate:"required"`
		Message     string `json:"message,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 從 JWT token 獲取當前用戶 ID
	requesterID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	addresseeID, err := shared.NewUserIDFromString(req.AddresseeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid addressee ID"})
		return
	}

	cmd := friendshipCommands.SendFriendRequestCommand{
		RequesterID: requesterID,
		AddresseeID: addresseeID,
		Message:     req.Message,
	}

	friendship, err := h.sendRequestHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, friendship)
}

// AcceptFriendRequest 接受好友邀請
func (h *FriendshipHandler) AcceptFriendRequest(c *gin.Context) {
	friendshipID := c.Param("id")
	if friendshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Friendship ID is required"})
		return
	}

	// 從 JWT token 獲取當前用戶 ID
	addresseeID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	fID, err := shared.NewFriendshipIDFromString(friendshipID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	cmd := friendshipCommands.AcceptFriendRequestCommand{
		AddresseeID:  addresseeID,
		FriendshipID: fID,
	}

	if err := h.acceptRequestHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

// DeclineFriendRequest 拒絕好友邀請
func (h *FriendshipHandler) DeclineFriendRequest(c *gin.Context) {
	friendshipID := c.Param("id")
	if friendshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Friendship ID is required"})
		return
	}

	// 從 JWT token 獲取當前用戶 ID
	addresseeID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	fID, err := shared.NewFriendshipIDFromString(friendshipID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	cmd := friendshipCommands.DeclineFriendRequestCommand{
		AddresseeID:  addresseeID,
		FriendshipID: fID,
	}

	if err := h.declineRequestHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request declined"})
}

// BlockUser 封鎖用戶
func (h *FriendshipHandler) BlockUser(c *gin.Context) {
	var req struct {
		BlockedID string `json:"blockedId" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 從 JWT token 獲取當前用戶 ID
	blockerID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	blockedID, err := shared.NewUserIDFromString(req.BlockedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blocked user ID"})
		return
	}

	cmd := friendshipCommands.BlockUserCommand{
		BlockerID: blockerID,
		BlockedID: blockedID,
	}

	if err := h.blockUserHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User blocked"})
}

// RemoveFriend 移除朋友
func (h *FriendshipHandler) RemoveFriend(c *gin.Context) {
	friendID := c.Param("friendId")
	if friendID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Friend ID is required"})
		return
	}

	// 從 JWT token 獲取當前用戶 ID
	userID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	fID, err := shared.NewUserIDFromString(friendID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friend ID"})
		return
	}

	cmd := friendshipCommands.RemoveFriendCommand{
		UserID:   userID,
		FriendID: fID,
	}

	if err := h.removeFriendHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend removed"})
}

// GetFriends 獲取朋友列表
func (h *FriendshipHandler) GetFriends(c *gin.Context) {
	// 從 JWT token 獲取當前用戶 ID
	userID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 解析分頁參數
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := friendshipQueries.GetFriendsQuery{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	}

	friends, err := h.getFriendsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"friends": friends})
}

// GetPendingRequests 獲取待處理的好友邀請
func (h *FriendshipHandler) GetPendingRequests(c *gin.Context) {
	// 從 JWT token 獲取當前用戶 ID
	userID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 解析分頁參數
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := friendshipQueries.GetPendingRequestsQuery{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	}

	requests, err := h.getPendingHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"pendingRequests": requests})
}

// GetSentRequests 獲取發送的好友邀請
func (h *FriendshipHandler) GetSentRequests(c *gin.Context) {
	// 從 JWT token 獲取當前用戶 ID
	userID, err := shared.NewUserIDFromString(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 解析分頁參數
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := friendshipQueries.GetSentRequestsQuery{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	}

	requests, err := h.getSentHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sentRequests": requests})
}