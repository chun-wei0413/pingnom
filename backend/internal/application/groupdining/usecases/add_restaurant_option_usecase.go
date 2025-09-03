package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type AddRestaurantOptionUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewAddRestaurantOptionUseCase(planRepo interfaces.GroupDiningPlanRepository) *AddRestaurantOptionUseCase {
	return &AddRestaurantOptionUseCase{
		planRepo: planRepo,
	}
}

func (uc *AddRestaurantOptionUseCase) Execute(req *dtos.AddRestaurantOptionRequest) (*dtos.GroupDiningPlanResponse, error) {
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

	if err := plan.AddRestaurantOption(req.Name, req.Address, req.Latitude, req.Longitude, req.CuisineType); err != nil {
		return nil, err
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return dtos.ToGroupDiningPlanResponse(plan), nil
}