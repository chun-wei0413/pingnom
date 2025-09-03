package usecases

import (
	"errors"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type SubmitVoteUseCase struct {
	planRepo interfaces.GroupDiningPlanRepository
	voteRepo interfaces.VoteRepository
}

func NewSubmitVoteUseCase(planRepo interfaces.GroupDiningPlanRepository, voteRepo interfaces.VoteRepository) *SubmitVoteUseCase {
	return &SubmitVoteUseCase{
		planRepo: planRepo,
		voteRepo: voteRepo,
	}
}

func (uc *SubmitVoteUseCase) Execute(req *dtos.SubmitVoteRequest) (*dtos.VoteResponse, error) {
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

	existingVote, err := uc.voteRepo.GetByPlanAndUser(req.PlanID, req.UserID)
	if err != nil && err.Error() != "vote not found" {
		return nil, err
	}

	var vote *aggregates.Vote
	if existingVote != nil {
		vote = existingVote
		vote.Choices = make([]aggregates.VoteChoice, 0)
	} else {
		vote, err = aggregates.NewVote(req.PlanID, req.UserID)
		if err != nil {
			return nil, err
		}
	}

	for _, timeSlotID := range req.TimeSlotIDs {
		if err := vote.AddTimeChoice(timeSlotID); err != nil {
			return nil, err
		}
	}

	for _, restaurantID := range req.RestaurantIDs {
		if err := vote.AddRestaurantChoice(restaurantID); err != nil {
			return nil, err
		}
	}

	if req.Comment != "" {
		vote.SetComment(req.Comment)
	}

	if err := vote.IsValid(); err != nil {
		return nil, err
	}

	if existingVote != nil {
		if err := uc.voteRepo.Update(vote); err != nil {
			return nil, err
		}
	} else {
		if err := uc.voteRepo.Create(vote); err != nil {
			return nil, err
		}
	}

	if err := plan.RecordVote(req.UserID, req.TimeSlotIDs, req.RestaurantIDs); err != nil {
		return nil, err
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return dtos.ToVoteResponse(vote), nil
}