package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type GetGroupDiningPlanUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewGetGroupDiningPlanUseCase(planRepo interfaces.GroupDiningPlanRepository) *GetGroupDiningPlanUseCase {
	return &GetGroupDiningPlanUseCase{
		planRepo: planRepo,
	}
}

func (uc *GetGroupDiningPlanUseCase) ExecuteByID(planID string) (*dtos.GroupDiningPlanResponse, error) {
	if planID == "" {
		return nil, errors.New("plan ID cannot be empty")
	}

	plan, err := uc.planRepo.GetByID(planID)
	if err != nil {
		return nil, err
	}

	if plan == nil {
		return nil, errors.New("group dining plan not found")
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}

func (uc *GetGroupDiningPlanUseCase) ExecuteByCreator(createdBy string) ([]*dtos.GroupDiningPlanResponse, error) {
	if createdBy == "" {
		return nil, errors.New("creator ID cannot be empty")
	}

	plans, err := uc.planRepo.GetByCreator(createdBy)
	if err != nil {
		return nil, err
	}

	responses := make([]*dtos.GroupDiningPlanResponse, len(plans))
	for i, plan := range plans {
		responses[i] = dtos.ToGroupDiningPlanResponse(plan)
	}

	return responses, nil
}

func (uc *GetGroupDiningPlanUseCase) ExecuteByParticipant(userID string) ([]*dtos.GroupDiningPlanResponse, error) {
	if userID == "" {
		return nil, errors.New("user ID cannot be empty")
	}

	plans, err := uc.planRepo.GetByParticipant(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dtos.GroupDiningPlanResponse, len(plans))
	for i, plan := range plans {
		responses[i] = dtos.ToGroupDiningPlanResponse(plan)
	}

	return responses, nil
}