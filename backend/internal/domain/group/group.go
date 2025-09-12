package group

import (
	"errors"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// GroupStatus 代表群組狀態
type GroupStatus int

const (
	StatusActive   GroupStatus = iota // 活躍
	StatusInactive                    // 非活躍
	StatusArchived                    // 已封存
)

func (s GroupStatus) String() string {
	switch s {
	case StatusActive:
		return "active"
	case StatusInactive:
		return "inactive"
	case StatusArchived:
		return "archived"
	default:
		return "unknown"
	}
}

// GroupPrivacy 代表群組隱私設定
type GroupPrivacy int

const (
	PrivacyPublic  GroupPrivacy = iota // 公開群組
	PrivacyPrivate                     // 私人群組
)

func (p GroupPrivacy) String() string {
	switch p {
	case PrivacyPublic:
		return "public"
	case PrivacyPrivate:
		return "private"
	default:
		return "unknown"
	}
}

// GroupMemberRole 代表群組成員角色
type GroupMemberRole int

const (
	RoleAdmin  GroupMemberRole = iota // 管理員
	RoleMember                        // 一般成員
)

func (r GroupMemberRole) String() string {
	switch r {
	case RoleAdmin:
		return "admin"
	case RoleMember:
		return "member"
	default:
		return "unknown"
	}
}

// GroupMember 代表群組成員
type GroupMember struct {
	UserID    shared.UserID   `json:"userId"`
	Role      GroupMemberRole `json:"role"`
	JoinedAt  time.Time       `json:"joinedAt"`
	IsActive  bool            `json:"isActive"`
}

// Group 代表一個聚餐群組
type Group struct {
	ID             GroupID       `json:"id"`
	Name           string        `json:"name"`
	Description    string        `json:"description,omitempty"`
	CreatorID      shared.UserID `json:"creatorId"`
	Status         GroupStatus   `json:"status"`
	Privacy        GroupPrivacy  `json:"privacy"`
	Members        []GroupMember `json:"members"`
	MaxMembers     int           `json:"maxMembers"`
	ActivityCount  int           `json:"activityCount"`
	LastActivityAt *time.Time    `json:"lastActivityAt,omitempty"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}

// NewGroup 建立新的群組
func NewGroup(creatorID shared.UserID, name, description string, privacy GroupPrivacy, maxMembers int) (*Group, error) {
	// 驗證群組名稱
	if len(name) == 0 || len(name) > 50 {
		return nil, errors.New("group name must be between 1 and 50 characters")
	}

	// 驗證描述長度
	if len(description) > 200 {
		return nil, errors.New("group description must be less than 200 characters")
	}

	// 驗證最大成員數
	if maxMembers < 2 || maxMembers > 50 {
		return nil, errors.New("max members must be between 2 and 50")
	}

	now := time.Now()
	
	// 創建者自動成為管理員
	creator := GroupMember{
		UserID:   creatorID,
		Role:     RoleAdmin,
		JoinedAt: now,
		IsActive: true,
	}

	return &Group{
		ID:             NewGroupID(),
		Name:           name,
		Description:    description,
		CreatorID:      creatorID,
		Status:         StatusActive,
		Privacy:        privacy,
		Members:        []GroupMember{creator},
		MaxMembers:     maxMembers,
		ActivityCount:  0,
		LastActivityAt: nil,
		CreatedAt:      now,
		UpdatedAt:      now,
	}, nil
}

// AddMember 新增群組成員
func (g *Group) AddMember(userID shared.UserID) error {
	// 檢查群組是否活躍
	if g.Status != StatusActive {
		return errors.New("cannot add member to inactive group")
	}

	// 檢查是否已達最大成員數
	if len(g.Members) >= g.MaxMembers {
		return errors.New("group has reached maximum member limit")
	}

	// 檢查用戶是否已是成員
	for _, member := range g.Members {
		if member.UserID.Equals(userID) {
			if member.IsActive {
				return errors.New("user is already a member of this group")
			}
			// 重新啟用已存在但非活躍的成員
			member.IsActive = true
			g.UpdatedAt = time.Now()
			return nil
		}
	}

	// 新增新成員
	newMember := GroupMember{
		UserID:   userID,
		Role:     RoleMember,
		JoinedAt: time.Now(),
		IsActive: true,
	}

	g.Members = append(g.Members, newMember)
	g.UpdatedAt = time.Now()
	return nil
}

// RemoveMember 移除群組成員
func (g *Group) RemoveMember(userID shared.UserID, removerID shared.UserID) error {
	// 檢查移除者是否為管理員
	if !g.IsAdmin(removerID) {
		return errors.New("only admin can remove members")
	}

	// 檢查是否試圖移除創建者
	if g.CreatorID.Equals(userID) {
		return errors.New("cannot remove group creator")
	}

	// 尋找並移除成員
	for i, member := range g.Members {
		if member.UserID.Equals(userID) && member.IsActive {
			g.Members[i].IsActive = false
			g.UpdatedAt = time.Now()
			return nil
		}
	}

	return errors.New("user is not an active member of this group")
}

// PromoteToAdmin 提升成員為管理員
func (g *Group) PromoteToAdmin(userID shared.UserID, promoterID shared.UserID) error {
	// 檢查提升者是否為管理員
	if !g.IsAdmin(promoterID) {
		return errors.New("only admin can promote members")
	}

	// 尋找並提升成員
	for i, member := range g.Members {
		if member.UserID.Equals(userID) && member.IsActive {
			if member.Role == RoleAdmin {
				return errors.New("user is already an admin")
			}
			g.Members[i].Role = RoleAdmin
			g.UpdatedAt = time.Now()
			return nil
		}
	}

	return errors.New("user is not an active member of this group")
}

// UpdateInfo 更新群組資訊
func (g *Group) UpdateInfo(name, description string, updaterID shared.UserID) error {
	// 檢查更新者是否為管理員
	if !g.IsAdmin(updaterID) {
		return errors.New("only admin can update group info")
	}

	// 驗證群組名稱
	if len(name) == 0 || len(name) > 50 {
		return errors.New("group name must be between 1 and 50 characters")
	}

	// 驗證描述長度
	if len(description) > 200 {
		return errors.New("group description must be less than 200 characters")
	}

	g.Name = name
	g.Description = description
	g.UpdatedAt = time.Now()
	return nil
}

// Archive 封存群組
func (g *Group) Archive(archiverID shared.UserID) error {
	// 檢查封存者是否為管理員
	if !g.IsAdmin(archiverID) {
		return errors.New("only admin can archive group")
	}

	if g.Status == StatusArchived {
		return errors.New("group is already archived")
	}

	g.Status = StatusArchived
	g.UpdatedAt = time.Now()
	return nil
}

// Activate 啟用群組
func (g *Group) Activate(activatorID shared.UserID) error {
	// 檢查啟用者是否為管理員
	if !g.IsAdmin(activatorID) {
		return errors.New("only admin can activate group")
	}

	if g.Status == StatusActive {
		return errors.New("group is already active")
	}

	g.Status = StatusActive
	g.UpdatedAt = time.Now()
	return nil
}

// RecordActivity 記錄群組活動
func (g *Group) RecordActivity() {
	g.ActivityCount++
	now := time.Now()
	g.LastActivityAt = &now
	g.UpdatedAt = now
}

// IsAdmin 檢查用戶是否為管理員
func (g *Group) IsAdmin(userID shared.UserID) bool {
	for _, member := range g.Members {
		if member.UserID.Equals(userID) && member.IsActive && member.Role == RoleAdmin {
			return true
		}
	}
	return false
}

// IsMember 檢查用戶是否為成員
func (g *Group) IsMember(userID shared.UserID) bool {
	for _, member := range g.Members {
		if member.UserID.Equals(userID) && member.IsActive {
			return true
		}
	}
	return false
}

// GetActiveMembers 取得活躍成員列表
func (g *Group) GetActiveMembers() []GroupMember {
	var activeMembers []GroupMember
	for _, member := range g.Members {
		if member.IsActive {
			activeMembers = append(activeMembers, member)
		}
	}
	return activeMembers
}

// GetMemberCount 取得活躍成員數量
func (g *Group) GetMemberCount() int {
	count := 0
	for _, member := range g.Members {
		if member.IsActive {
			count++
		}
	}
	return count
}

// CanJoin 檢查是否可加入群組
func (g *Group) CanJoin() bool {
	return g.Status == StatusActive && len(g.GetActiveMembers()) < g.MaxMembers
}