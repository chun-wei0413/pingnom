package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type StartVotingUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewStartVotingUseCase(planRepo interfaces.GroupDiningPlanRepository) *StartVotingUseCase {
	return &StartVotingUseCase{
		planRepo: planRepo,
	}
}

func (uc *StartVotingUseCase) Execute(req *dtos.StartVotingRequest) (*dtos.GroupDiningPlanResponse, error) {
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

	if err := plan.StartVoting(req.VotingDeadline); err != nil {
		return nil, err
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}