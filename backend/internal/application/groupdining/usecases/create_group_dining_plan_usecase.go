package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type CreateGroupDiningPlanUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewCreateGroupDiningPlanUseCase(planRepo interfaces.GroupDiningPlanRepository) *CreateGroupDiningPlanUseCase {
	return &CreateGroupDiningPlanUseCase{
		planRepo: planRepo,
	}
}

func (uc *CreateGroupDiningPlanUseCase) Execute(req *dtos.CreateGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
	if req == nil {
		return nil, errors.New("request cannot be nil")
	}

	plan, err := aggregates.NewGroupDiningPlan(req.CreatedBy, req.Title, req.Description)
	if err != nil {
		return nil, err
	}

	if err := uc.planRepo.Create(plan); err != nil {
		return nil, err
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}