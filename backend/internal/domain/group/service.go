package group

import (
	"errors"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Service 群組領域服務
type Service struct {
	groupRepo Repository
}

// NewService 建立新的群組服務
func NewService(groupRepo Repository) *Service {
	return &Service{
		groupRepo: groupRepo,
	}
}

// CreateGroup 建立群組
func (s *Service) CreateGroup(creatorID shared.UserID, name, description string, privacy GroupPrivacy, maxMembers int) (*Group, error) {
	// 檢查創建者是否已有過多群組
	creatorGroups, err := s.groupRepo.GetByCreatorID(creatorID)
	if err != nil {
		return nil, err
	}
	
	activeGroupCount := 0
	for _, group := range creatorGroups {
		if group.Status == StatusActive {
			activeGroupCount++
		}
	}
	
	if activeGroupCount >= 10 {
		return nil, errors.New("creator has reached maximum number of active groups")
	}

	// 建立新群組
	group, err := NewGroup(creatorID, name, description, privacy, maxMembers)
	if err != nil {
		return nil, err
	}

	// 儲存群組
	if err := s.groupRepo.Create(group); err != nil {
		return nil, err
	}

	return group, nil
}

// InviteMember 邀請成員加入群組
func (s *Service) InviteMember(groupID GroupID, inviterID, inviteeID shared.UserID) error {
	// 取得群組
	group, err := s.groupRepo.GetByID(groupID)
	if err != nil {
		return err
	}

	// 檢查邀請者是否為管理員
	if !group.IsAdmin(inviterID) {
		return errors.New("only admin can invite members")
	}

	// 檢查受邀者是否已為成員
	if group.IsMember(inviteeID) {
		return errors.New("user is already a member of this group")
	}

	// 檢查受邀者加入的群組數量
	memberGroups, err := s.groupRepo.GetByMemberID(inviteeID)
	if err != nil {
		return err
	}
	
	activeGroupCount := 0
	for _, g := range memberGroups {
		if g.Status == StatusActive && g.IsMember(inviteeID) {
			activeGroupCount++
		}
	}
	
	if activeGroupCount >= 20 {
		return errors.New("user has reached maximum number of groups")
	}

	// 新增成員
	if err := group.AddMember(inviteeID); err != nil {
		return err
	}

	// 更新群組
	return s.groupRepo.Update(group)
}

// LeaveGroup 離開群組
func (s *Service) LeaveGroup(groupID GroupID, userID shared.UserID) error {
	// 取得群組
	group, err := s.groupRepo.GetByID(groupID)
	if err != nil {
		return err
	}

	// 檢查是否為創建者
	if group.CreatorID.Equals(userID) {
		return errors.New("creator cannot leave group, transfer ownership or archive group instead")
	}

	// 移除成員
	if err := group.RemoveMember(userID, userID); err != nil {
		// 允許成員自己離開
		for i, member := range group.Members {
			if member.UserID.Equals(userID) && member.IsActive {
				group.Members[i].IsActive = false
				group.UpdatedAt = time.Now()
				break
			}
		}
	}

	// 更新群組
	return s.groupRepo.Update(group)
}

// TransferOwnership 轉移群組擁有權
func (s *Service) TransferOwnership(groupID GroupID, currentOwnerID, newOwnerID shared.UserID) error {
	// 取得群組
	group, err := s.groupRepo.GetByID(groupID)
	if err != nil {
		return err
	}

	// 檢查當前用戶是否為創建者
	if !group.CreatorID.Equals(currentOwnerID) {
		return errors.New("only group creator can transfer ownership")
	}

	// 檢查新擁有者是否為成員
	if !group.IsMember(newOwnerID) {
		return errors.New("new owner must be a member of the group")
	}

	// 轉移擁有權
	group.CreatorID = newOwnerID
	
	// 確保新擁有者為管理員
	for i, member := range group.Members {
		if member.UserID.Equals(newOwnerID) {
			group.Members[i].Role = RoleAdmin
			break
		}
	}

	group.UpdatedAt = time.Now()

	// 更新群組
	return s.groupRepo.Update(group)
}

// ArchiveInactiveGroups 封存非活躍群組
func (s *Service) ArchiveInactiveGroups() error {
	// 這個方法可以作為定期任務執行
	// 封存超過一定時間沒有活動的群組
	
	// 實際實作可以根據需求調整條件
	// 例如：30天沒有活動的群組
	return nil
}

// GetGroupRecommendations 取得群組推薦
func (s *Service) GetGroupRecommendations(userID shared.UserID, limit int) ([]*Group, error) {
	// 基於用戶的朋友關係和活動歷史推薦群組
	// 這裡可以實作複雜的推薦算法
	
	// 目前簡單返回公開的活躍群組
	return s.groupRepo.GetActiveGroups(0, limit)
}