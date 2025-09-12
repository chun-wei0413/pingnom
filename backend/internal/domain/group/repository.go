package group

import (
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Repository 群組儲存庫接口
type Repository interface {
	// Create 建立新群組
	Create(group *Group) error
	
	// GetByID 根據 ID 取得群組
	GetByID(id GroupID) (*Group, error)
	
	// GetByCreatorID 根據創建者 ID 取得群組列表
	GetByCreatorID(creatorID shared.UserID) ([]*Group, error)
	
	// GetByMemberID 根據成員 ID 取得加入的群組列表
	GetByMemberID(memberID shared.UserID) ([]*Group, error)
	
	// GetActiveGroups 取得活躍群組列表（分頁）
	GetActiveGroups(offset, limit int) ([]*Group, error)
	
	// Update 更新群組
	Update(group *Group) error
	
	// Delete 刪除群組
	Delete(id GroupID) error
	
	// SearchByName 根據名稱搜尋群組
	SearchByName(name string, offset, limit int) ([]*Group, error)
	
	// GetGroupStats 取得群組統計資訊
	GetGroupStats(id GroupID) (*GroupStats, error)
}

// GroupStats 群組統計資訊
type GroupStats struct {
	GroupID              GroupID `json:"groupId"`
	TotalMembers         int     `json:"totalMembers"`
	ActiveMembers        int     `json:"activeMembers"`
	TotalActivities      int     `json:"totalActivities"`
	ActivitiesThisMonth  int     `json:"activitiesThisMonth"`
	LastActivityDaysAgo  int     `json:"lastActivityDaysAgo"`
}