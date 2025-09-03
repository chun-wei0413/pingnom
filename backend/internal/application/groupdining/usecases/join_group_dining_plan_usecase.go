package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type JoinGroupDiningPlanUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewJoinGroupDiningPlanUseCase(planRepo interfaces.GroupDiningPlanRepository) *JoinGroupDiningPlanUseCase {
	return &JoinGroupDiningPlanUseCase{
		planRepo: planRepo,
	}
}

func (uc *JoinGroupDiningPlanUseCase) Execute(req *dtos.JoinGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
	if req == nil {
		return nil, errors.New("request cannot be nil")
	}

	plan, err := uc.planRepo.GetByID(req.PlanID)
	if err != nil {
		return nil, err
	}

	if plan == nil {
		return nil, errors.New("group dining plan not found")
	}

	if err := plan.AddParticipant(req.UserID, req.DisplayName); err != nil {
		return nil, err
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}