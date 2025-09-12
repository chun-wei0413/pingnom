package group

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// GetGroupByIDQuery 根據 ID 取得群組查詢
type GetGroupByIDQuery struct {
	GroupID string `json:"groupId" validate:"required"`
	UserID  string `json:"userId" validate:"required"` // 用於檢查權限
}

// GetGroupByIDHandler 根據 ID 取得群組查詢處理器
type GetGroupByIDHandler struct {
	groupRepo group.Repository
}

// NewGetGroupByIDHandler 建立新的根據 ID 取得群組查詢處理器
func NewGetGroupByIDHandler(groupRepo group.Repository) *GetGroupByIDHandler {
	return &GetGroupByIDHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理根據 ID 取得群組查詢
func (h *GetGroupByIDHandler) Handle(query GetGroupByIDQuery) (*group.Group, error) {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(query.GroupID)
	if err != nil {
		return nil, err
	}

	userID, err := shared.NewUserIDFromString(query.UserID)
	if err != nil {
		return nil, err
	}

	// 取得群組
	g, err := h.groupRepo.GetByID(groupID)
	if err != nil {
		return nil, err
	}

	// 檢查權限（私人群組只有成員可以查看）
	if g.Privacy == group.PrivacyPrivate && !g.IsMember(userID) {
		return nil, errors.New("access denied: private group")
	}

	return g, nil
}

// GetUserGroupsQuery 取得用戶群組列表查詢
type GetUserGroupsQuery struct {
	UserID string `json:"userId" validate:"required"`
	Status string `json:"status,omitempty"` // active, inactive, archived, all
}

// GetUserGroupsHandler 取得用戶群組列表查詢處理器
type GetUserGroupsHandler struct {
	groupRepo group.Repository
}

// NewGetUserGroupsHandler 建立新的取得用戶群組列表查詢處理器
func NewGetUserGroupsHandler(groupRepo group.Repository) *GetUserGroupsHandler {
	return &GetUserGroupsHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理取得用戶群組列表查詢
func (h *GetUserGroupsHandler) Handle(query GetUserGroupsQuery) ([]*group.Group, error) {
	// 轉換 UserID
	userID, err := shared.NewUserIDFromString(query.UserID)
	if err != nil {
		return nil, err
	}

	// 取得用戶加入的群組
	groups, err := h.groupRepo.GetByMemberID(userID)
	if err != nil {
		return nil, err
	}

	// 根據狀態過濾
	if query.Status != "" && query.Status != "all" {
		var filteredGroups []*group.Group
		for _, g := range groups {
			switch query.Status {
			case "active":
				if g.Status == group.StatusActive {
					filteredGroups = append(filteredGroups, g)
				}
			case "inactive":
				if g.Status == group.StatusInactive {
					filteredGroups = append(filteredGroups, g)
				}
			case "archived":
				if g.Status == group.StatusArchived {
					filteredGroups = append(filteredGroups, g)
				}
			}
		}
		groups = filteredGroups
	}

	return groups, nil
}

// SearchGroupsQuery 搜尋群組查詢
type SearchGroupsQuery struct {
	Name   string `json:"name" validate:"required,min=1"`
	Offset int    `json:"offset" validate:"min=0"`
	Limit  int    `json:"limit" validate:"min=1,max=100"`
}

// SearchGroupsHandler 搜尋群組查詢處理器
type SearchGroupsHandler struct {
	groupRepo group.Repository
}

// NewSearchGroupsHandler 建立新的搜尋群組查詢處理器
func NewSearchGroupsHandler(groupRepo group.Repository) *SearchGroupsHandler {
	return &SearchGroupsHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理搜尋群組查詢
func (h *SearchGroupsHandler) Handle(query SearchGroupsQuery) ([]*group.Group, error) {
	// 搜尋群組（只返回公開群組）
	groups, err := h.groupRepo.SearchByName(query.Name, query.Offset, query.Limit)
	if err != nil {
		return nil, err
	}

	// 過濾只返回公開和活躍的群組
	var publicGroups []*group.Group
	for _, g := range groups {
		if g.Privacy == group.PrivacyPublic && g.Status == group.StatusActive {
			publicGroups = append(publicGroups, g)
		}
	}

	return publicGroups, nil
}

// GetGroupStatsQuery 取得群組統計查詢
type GetGroupStatsQuery struct {
	GroupID string `json:"groupId" validate:"required"`
	UserID  string `json:"userId" validate:"required"`
}

// GetGroupStatsHandler 取得群組統計查詢處理器
type GetGroupStatsHandler struct {
	groupRepo group.Repository
}

// NewGetGroupStatsHandler 建立新的取得群組統計查詢處理器
func NewGetGroupStatsHandler(groupRepo group.Repository) *GetGroupStatsHandler {
	return &GetGroupStatsHandler{
		groupRepo: groupRepo,
	}
}

// Handle 處理取得群組統計查詢
func (h *GetGroupStatsHandler) Handle(query GetGroupStatsQuery) (*group.GroupStats, error) {
	// 轉換 ID
	groupID, err := group.NewGroupIDFromString(query.GroupID)
	if err != nil {
		return nil, err
	}

	userID, err := shared.NewUserIDFromString(query.UserID)
	if err != nil {
		return nil, err
	}

	// 檢查用戶是否為群組成員
	g, err := h.groupRepo.GetByID(groupID)
	if err != nil {
		return nil, err
	}

	if !g.IsMember(userID) {
		return nil, errors.New("access denied: not a member of this group")
	}

	// 取得群組統計
	return h.groupRepo.GetGroupStats(groupID)
}