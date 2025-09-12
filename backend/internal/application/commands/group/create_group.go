package group

import (
	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// CreateGroupCommand 建立群組指令
type CreateGroupCommand struct {
	CreatorID   string `json:"creatorId" validate:"required"`
	Name        string `json:"name" validate:"required,min=1,max=50"`
	Description string `json:"description" validate:"max=200"`
	Privacy     string `json:"privacy" validate:"required,oneof=public private"`
	MaxMembers  int    `json:"maxMembers" validate:"required,min=2,max=50"`
}

// CreateGroupHandler 建立群組指令處理器
type CreateGroupHandler struct {
	groupService *group.Service
}

// NewCreateGroupHandler 建立新的建立群組指令處理器
func NewCreateGroupHandler(groupService *group.Service) *CreateGroupHandler {
	return &CreateGroupHandler{
		groupService: groupService,
	}
}

// Handle 處理建立群組指令
func (h *CreateGroupHandler) Handle(cmd CreateGroupCommand) (*group.Group, error) {
	// 轉換 CreatorID
	creatorID, err := shared.NewUserIDFromString(cmd.CreatorID)
	if err != nil {
		return nil, err
	}

	// 轉換隱私設定
	var privacy group.GroupPrivacy
	switch cmd.Privacy {
	case "public":
		privacy = group.PrivacyPublic
	case "private":
		privacy = group.PrivacyPrivate
	default:
		privacy = group.PrivacyPrivate
	}

	// 建立群組
	newGroup, err := h.groupService.CreateGroup(
		creatorID,
		cmd.Name,
		cmd.Description,
		privacy,
		cmd.MaxMembers,
	)
	if err != nil {
		return nil, err
	}

	return newGroup, nil
}