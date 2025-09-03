package interfaces

import (
	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type GroupDiningPlanRepository interface {
	Create(plan *aggregates.GroupDiningPlan) error
	GetByID(id string) (*aggregates.GroupDiningPlan, error)
	GetByCreator(createdBy string) ([]*aggregates.GroupDiningPlan, error)
	GetByParticipant(userID string) ([]*aggregates.GroupDiningPlan, error)
	Update(plan *aggregates.GroupDiningPlan) error
	Delete(id string) error
	List(limit, offset int) ([]*aggregates.GroupDiningPlan, error)
}

type VoteRepository interface {
	Create(vote *aggregates.Vote) error
	GetByID(id string) (*aggregates.Vote, error)
	GetByPlanAndUser(planID, userID string) (*aggregates.Vote, error)
	GetByPlan(planID string) ([]*aggregates.Vote, error)
	Update(vote *aggregates.Vote) error
	Delete(id string) error
}