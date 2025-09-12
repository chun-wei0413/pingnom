package group

import (
	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// UpdateGroupInfoCommand 更新群組資訊指令
type UpdateGroupInfoCommand struct {
	GroupID     string `json:"groupId" validate:"required"`
	UpdaterID   string `json:"updaterId" validate:"required"`
	Name        string `json:"name" validate:"required,min=1,max=50"`
	Description string `json:"description" validate:"max=200"`
}

// UpdateGroupInfoHandler 更新群組資訊指令處理器
type UpdateGroupInfoHandler struct {
	groupRepo group.Repository
}

// NewUpdateGroupInfoHandler 建立新的更新群組資訊指令處理器
func NewUpdateGroupInfoHandler(groupRepo group.Repository) *UpdateGroupInfoHandler {
	return &UpdateGroupInfoHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理更新群組資訊指令
func (h *UpdateGroupInfoHandler) Handle(cmd UpdateGroupInfoCommand) error {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(cmd.GroupID)
	if err != nil {
		return err
	}

	updaterID, err := shared.NewUserIDFromString(cmd.UpdaterID)
	if err != nil {
		return err
	}

	// 取得群組
	g, err := h.groupRepo.GetByID(groupID)
	if err != nil {
		return err
	}

	// 更新群組資訊
	if err := g.UpdateInfo(cmd.Name, cmd.Description, updaterID); err != nil {
		return err
	}

	// 儲存更新
	return h.groupRepo.Update(g)
}

// InviteMemberCommand 邀請成員指令
type InviteMemberCommand struct {
	GroupID   string `json:"groupId" validate:"required"`
	InviterID string `json:"inviterId" validate:"required"`
	InviteeID string `json:"inviteeId" validate:"required"`
}

// InviteMemberHandler 邀請成員指令處理器
type InviteMemberHandler struct {
	groupService *group.Service
}

// NewInviteMemberHandler 建立新的邀請成員指令處理器
func NewInviteMemberHandler(groupService *group.Service) *InviteMemberHandler {
	return &InviteMemberHandler{
		groupService: groupService,
	}
}

// Handle 處理邀請成員指令
func (h *InviteMemberHandler) Handle(cmd InviteMemberCommand) error {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(cmd.GroupID)
	if err != nil {
		return err
	}

	inviterID, err := shared.NewUserIDFromString(cmd.InviterID)
	if err != nil {
		return err
	}

	inviteeID, err := shared.NewUserIDFromString(cmd.InviteeID)
	if err != nil {
		return err
	}

	// 邀請成員
	return h.groupService.InviteMember(groupID, inviterID, inviteeID)
}

// RemoveMemberCommand 移除成員指令
type RemoveMemberCommand struct {
	GroupID   string `json:"groupId" validate:"required"`
	RemoverID string `json:"removerId" validate:"required"`
	MemberID  string `json:"memberId" validate:"required"`
}

// RemoveMemberHandler 移除成員指令處理器
type RemoveMemberHandler struct {
	groupRepo group.Repository
}

// NewRemoveMemberHandler 建立新的移除成員指令處理器
func NewRemoveMemberHandler(groupRepo group.Repository) *RemoveMemberHandler {
	return &RemoveMemberHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理移除成員指令
func (h *RemoveMemberHandler) Handle(cmd RemoveMemberCommand) error {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(cmd.GroupID)
	if err != nil {
		return err
	}

	removerID, err := shared.NewUserIDFromString(cmd.RemoverID)
	if err != nil {
		return err
	}

	memberID, err := shared.NewUserIDFromString(cmd.MemberID)
	if err != nil {
		return err
	}

	// 取得群組
	g, err := h.groupRepo.GetByID(groupID)
	if err != nil {
		return err
	}

	// 移除成員
	if err := g.RemoveMember(memberID, removerID); err != nil {
		return err
	}

	// 儲存更新
	return h.groupRepo.Update(g)
}

// LeaveGroupCommand 離開群組指令
type LeaveGroupCommand struct {
	GroupID string `json:"groupId" validate:"required"`
	UserID  string `json:"userId" validate:"required"`
}

// LeaveGroupHandler 離開群組指令處理器
type LeaveGroupHandler struct {
	groupService *group.Service
}

// NewLeaveGroupHandler 建立新的離開群組指令處理器
func NewLeaveGroupHandler(groupService *group.Service) *LeaveGroupHandler {
	return &LeaveGroupHandler{
		groupService: groupService,
	}
}

// Handle 處理離開群組指令
func (h *LeaveGroupHandler) Handle(cmd LeaveGroupCommand) error {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(cmd.GroupID)
	if err != nil {
		return err
	}

	userID, err := shared.NewUserIDFromString(cmd.UserID)
	if err != nil {
		return err
	}

	// 離開群組
	return h.groupService.LeaveGroup(groupID, userID)
}