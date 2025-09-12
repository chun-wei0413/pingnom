package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	groupcommands "github.com/chun-wei0413/pingnom/internal/application/commands/group"
	groupqueries "github.com/chun-wei0413/pingnom/internal/application/queries/group"
)

type GroupHandler struct {
	createGroupHandler     *groupcommands.CreateGroupHandler
	updateGroupInfoHandler *groupcommands.UpdateGroupInfoHandler
	inviteMemberHandler    *groupcommands.InviteMemberHandler
	removeMemberHandler    *groupcommands.RemoveMemberHandler
	leaveGroupHandler      *groupcommands.LeaveGroupHandler
	getGroupByIDHandler    *groupqueries.GetGroupByIDHandler
	getUserGroupsHandler   *groupqueries.GetUserGroupsHandler
	searchGroupsHandler    *groupqueries.SearchGroupsHandler
	getGroupStatsHandler   *groupqueries.GetGroupStatsHandler
}

func NewGroupHandler(
	createGroupHandler *groupcommands.CreateGroupHandler,
	updateGroupInfoHandler *groupcommands.UpdateGroupInfoHandler,
	inviteMemberHandler *groupcommands.InviteMemberHandler,
	removeMemberHandler *groupcommands.RemoveMemberHandler,
	leaveGroupHandler *groupcommands.LeaveGroupHandler,
	getGroupByIDHandler *groupqueries.GetGroupByIDHandler,
	getUserGroupsHandler *groupqueries.GetUserGroupsHandler,
	searchGroupsHandler *groupqueries.SearchGroupsHandler,
	getGroupStatsHandler *groupqueries.GetGroupStatsHandler,
) *GroupHandler {
	return &GroupHandler{
		createGroupHandler:     createGroupHandler,
		updateGroupInfoHandler: updateGroupInfoHandler,
		inviteMemberHandler:    inviteMemberHandler,
		removeMemberHandler:    removeMemberHandler,
		leaveGroupHandler:      leaveGroupHandler,
		getGroupByIDHandler:    getGroupByIDHandler,
		getUserGroupsHandler:   getUserGroupsHandler,
		searchGroupsHandler:    searchGroupsHandler,
		getGroupStatsHandler:   getGroupStatsHandler,
	}
}

// POST /api/v1/groups
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	var request groupcommands.CreateGroupCommand
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Set creator ID from authenticated user
	request.CreatorID = userID.(string)

	group, err := h.createGroupHandler.Handle(request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to create group",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Group created successfully",
		"group":   group,
	})
}

// GET /api/v1/groups/:id
func (h *GroupHandler) GetGroupByID(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	query := groupqueries.GetGroupByIDQuery{
		GroupID: groupID,
		UserID:  userID.(string),
	}

	group, err := h.getGroupByIDHandler.Handle(query)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "access denied: private group" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to get group",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"group": group})
}

// GET /api/v1/groups
func (h *GroupHandler) GetUserGroups(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	status := c.Query("status") // active, inactive, archived, all

	query := groupqueries.GetUserGroupsQuery{
		UserID: userID.(string),
		Status: status,
	}

	groups, err := h.getUserGroupsHandler.Handle(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user groups",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"count":  len(groups),
	})
}

// GET /api/v1/groups/search
func (h *GroupHandler) SearchGroups(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search name is required"})
		return
	}

	offsetStr := c.DefaultQuery("offset", "0")
	limitStr := c.DefaultQuery("limit", "20")

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	query := groupqueries.SearchGroupsQuery{
		Name:   name,
		Offset: offset,
		Limit:  limit,
	}

	groups, err := h.searchGroupsHandler.Handle(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to search groups",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"count":  len(groups),
	})
}

// PUT /api/v1/groups/:id
func (h *GroupHandler) UpdateGroupInfo(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	command := groupcommands.UpdateGroupInfoCommand{
		GroupID:     groupID,
		UpdaterID:   userID.(string),
		Name:        request.Name,
		Description: request.Description,
	}

	err := h.updateGroupInfoHandler.Handle(command)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "only admin can update group info" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: admin only"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Failed to update group",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Group updated successfully"})
}

// POST /api/v1/groups/:id/members
func (h *GroupHandler) InviteMember(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		InviteeID string `json:"inviteeId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	command := groupcommands.InviteMemberCommand{
		GroupID:   groupID,
		InviterID: userID.(string),
		InviteeID: request.InviteeID,
	}

	err := h.inviteMemberHandler.Handle(command)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "only admin can invite members" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: admin only"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Failed to invite member",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Member invited successfully"})
}

// DELETE /api/v1/groups/:id/members/:memberId
func (h *GroupHandler) RemoveMember(c *gin.Context) {
	groupID := c.Param("id")
	memberID := c.Param("memberId")
	
	if groupID == "" || memberID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID and Member ID are required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	command := groupcommands.RemoveMemberCommand{
		GroupID:   groupID,
		RemoverID: userID.(string),
		MemberID:  memberID,
	}

	err := h.removeMemberHandler.Handle(command)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "only admin can remove members" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: admin only"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Failed to remove member",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

// POST /api/v1/groups/:id/leave
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	command := groupcommands.LeaveGroupCommand{
		GroupID: groupID,
		UserID:  userID.(string),
	}

	err := h.leaveGroupHandler.Handle(command)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "creator cannot leave group, transfer ownership or archive group instead" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Creator cannot leave group"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Failed to leave group",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left group successfully"})
}

// GET /api/v1/groups/:id/stats
func (h *GroupHandler) GetGroupStats(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	query := groupqueries.GetGroupStatsQuery{
		GroupID: groupID,
		UserID:  userID.(string),
	}

	stats, err := h.getGroupStatsHandler.Handle(query)
	if err != nil {
		if err.Error() == "group not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		} else if err.Error() == "access denied: not a member of this group" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: members only"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to get group stats",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}