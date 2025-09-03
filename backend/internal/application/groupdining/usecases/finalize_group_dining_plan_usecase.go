package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type FinalizeGroupDiningPlanUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewFinalizeGroupDiningPlanUseCase(planRepo interfaces.GroupDiningPlanRepository) *FinalizeGroupDiningPlanUseCase {
	return &FinalizeGroupDiningPlanUseCase{
		planRepo: planRepo,
	}
}

func (uc *FinalizeGroupDiningPlanUseCase) Execute(req *dtos.FinalizeGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
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

	if err := plan.ConfirmPlan(req.TimeSlotID, req.RestaurantID); err != nil {
		return nil, err
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}