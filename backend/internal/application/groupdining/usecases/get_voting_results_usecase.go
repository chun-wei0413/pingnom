package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
)

type GetVotingResultsUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
}

func NewGetVotingResultsUseCase(planRepo interfaces.GroupDiningPlanRepository) *GetVotingResultsUseCase {
	return &GetVotingResultsUseCase{
		planRepo: planRepo,
	}
}

func (uc *GetVotingResultsUseCase) Execute(planID string) (*dtos.VotingResultsResponse, error) {
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

	results := plan.GetVotingResults()
	
	timeSlots := make([]dtos.TimeSlotResponse, len(plan.TimeSlots))
	for i, ts := range plan.TimeSlots {
		timeSlots[i] = dtos.TimeSlotResponse{
			ID:          ts.ID,
			StartTime:   ts.StartTime,
			EndTime:     ts.EndTime,
			Description: ts.Description,
			VoteCount:   ts.VoteCount,
		}
	}

	restaurants := make([]dtos.RestaurantOptionResponse, len(plan.RestaurantOptions))
	for i, ro := range plan.RestaurantOptions {
		restaurants[i] = dtos.RestaurantOptionResponse{
			ID:          ro.ID,
			Name:        ro.Name,
			Address:     ro.Address,
			Latitude:    ro.Latitude,
			Longitude:   ro.Longitude,
			CuisineType: ro.CuisineType,
			VoteCount:   ro.VoteCount,
		}
	}

	return &dtos.VotingResultsResponse{
		TotalParticipants: results["total_participants"].(int),
		VotedParticipants: results["voted_participants"].(int),
		VotingProgress:    results["voting_progress"].(float64),
		TimeSlots:         timeSlots,
		Restaurants:       restaurants,
	}, nil
}