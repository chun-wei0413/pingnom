package services

import (
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/interfaces"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/usecases"
)

type GroupDiningService struct {
	createPlanUC       *usecases.CreateGroupDiningPlanUseCase
	addTimeSlotUC      *usecases.AddTimeSlotUseCase
	addRestaurantUC    *usecases.AddRestaurantOptionUseCase
	joinPlanUC         *usecases.JoinGroupDiningPlanUseCase
	startVotingUC      *usecases.StartVotingUseCase
	submitVoteUC       *usecases.SubmitVoteUseCase
	finalizePlanUC     *usecases.FinalizeGroupDiningPlanUseCase
	getPlanUC          *usecases.GetGroupDiningPlanUseCase
	getVotingResultsUC *usecases.GetVotingResultsUseCase
}

func NewGroupDiningService(
	planRepo interfaces.GroupDiningPlanRepository,
	voteRepo interfaces.VoteRepository,
) *GroupDiningService {
	return &GroupDiningService{
		createPlanUC:       usecases.NewCreateGroupDiningPlanUseCase(planRepo),
		addTimeSlotUC:      usecases.NewAddTimeSlotUseCase(planRepo),
		addRestaurantUC:    usecases.NewAddRestaurantOptionUseCase(planRepo),
		joinPlanUC:         usecases.NewJoinGroupDiningPlanUseCase(planRepo),
		startVotingUC:      usecases.NewStartVotingUseCase(planRepo),
		submitVoteUC:       usecases.NewSubmitVoteUseCase(planRepo, voteRepo),
		finalizePlanUC:     usecases.NewFinalizeGroupDiningPlanUseCase(planRepo),
		getPlanUC:          usecases.NewGetGroupDiningPlanUseCase(planRepo),
		getVotingResultsUC: usecases.NewGetVotingResultsUseCase(planRepo),
	}
}

func (s *GroupDiningService) CreateGroupDiningPlan(req *dtos.CreateGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.createPlanUC.Execute(req)
}

func (s *GroupDiningService) AddTimeSlot(req *dtos.AddTimeSlotRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.addTimeSlotUC.Execute(req)
}

func (s *GroupDiningService) AddRestaurantOption(req *dtos.AddRestaurantOptionRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.addRestaurantUC.Execute(req)
}

func (s *GroupDiningService) JoinGroupDiningPlan(req *dtos.JoinGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.joinPlanUC.Execute(req)
}

func (s *GroupDiningService) StartVoting(req *dtos.StartVotingRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.startVotingUC.Execute(req)
}

func (s *GroupDiningService) SubmitVote(req *dtos.SubmitVoteRequest) (*dtos.VoteResponse, error) {
	return s.submitVoteUC.Execute(req)
}

func (s *GroupDiningService) FinalizeGroupDiningPlan(req *dtos.FinalizeGroupDiningPlanRequest) (*dtos.GroupDiningPlanResponse, error) {
	return s.finalizePlanUC.Execute(req)
}

func (s *GroupDiningService) GetGroupDiningPlanByID(planID string) (*dtos.GroupDiningPlanResponse, error) {
	return s.getPlanUC.ExecuteByID(planID)
}

func (s *GroupDiningService) GetGroupDiningPlansByCreator(createdBy string) ([]*dtos.GroupDiningPlanResponse, error) {
	return s.getPlanUC.ExecuteByCreator(createdBy)
}

func (s *GroupDiningService) GetGroupDiningPlansByParticipant(userID string) ([]*dtos.GroupDiningPlanResponse, error) {
	return s.getPlanUC.ExecuteByParticipant(userID)
}

func (s *GroupDiningService) GetVotingResults(planID string) (*dtos.VotingResultsResponse, error) {
	return s.getVotingResultsUC.Execute(planID)
}