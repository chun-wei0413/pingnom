package dtos

import (
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type CreateGroupDiningPlanRequest struct {
	CreatedBy   string `json:"created_by" validate:"required"`
	Title       string `json:"title" validate:"required,min=1,max=100"`
	Description string `json:"description" validate:"max=500"`
}

type AddTimeSlotRequest struct {
	PlanID      string    `json:"plan_id" validate:"required"`
	StartTime   time.Time `json:"start_time" validate:"required"`
	EndTime     time.Time `json:"end_time" validate:"required"`
	Description string    `json:"description" validate:"max=100"`
}

type AddRestaurantOptionRequest struct {
	PlanID      string  `json:"plan_id" validate:"required"`
	Name        string  `json:"name" validate:"required,min=1,max=100"`
	Address     string  `json:"address" validate:"max=200"`
	Latitude    float64 `json:"latitude" validate:"min=-90,max=90"`
	Longitude   float64 `json:"longitude" validate:"min=-180,max=180"`
	CuisineType string  `json:"cuisine_type" validate:"max=50"`
}

type JoinGroupDiningPlanRequest struct {
	PlanID      string `json:"plan_id" validate:"required"`
	UserID      string `json:"user_id" validate:"required"`
	DisplayName string `json:"display_name" validate:"required,min=1,max=50"`
}

type StartVotingRequest struct {
	PlanID         string     `json:"plan_id" validate:"required"`
	VotingDeadline *time.Time `json:"voting_deadline,omitempty"`
}

type SubmitVoteRequest struct {
	PlanID        string   `json:"plan_id" validate:"required"`
	UserID        string   `json:"user_id" validate:"required"`
	TimeSlotIDs   []string `json:"time_slot_ids" validate:"required,min=1"`
	RestaurantIDs []string `json:"restaurant_ids" validate:"required,min=1"`
	Comment       string   `json:"comment,omitempty" validate:"max=200"`
}

type FinalizeGroupDiningPlanRequest struct {
	PlanID       string `json:"plan_id" validate:"required"`
	TimeSlotID   string `json:"time_slot_id" validate:"required"`
	RestaurantID string `json:"restaurant_id" validate:"required"`
}

type GroupDiningPlanResponse struct {
	ID                  string                       `json:"id"`
	CreatedBy           string                       `json:"created_by"`
	Title               string                       `json:"title"`
	Description         string                       `json:"description"`
	Status              string                       `json:"status"`
	TimeSlots           []TimeSlotResponse           `json:"time_slots"`
	RestaurantOptions   []RestaurantOptionResponse   `json:"restaurant_options"`
	Participants        []ParticipantResponse        `json:"participants"`
	ConfirmedTimeSlot   *TimeSlotResponse           `json:"confirmed_time_slot,omitempty"`
	ConfirmedRestaurant *RestaurantOptionResponse   `json:"confirmed_restaurant,omitempty"`
	CreatedAt           time.Time                    `json:"created_at"`
	UpdatedAt           time.Time                    `json:"updated_at"`
	VotingDeadline      *time.Time                  `json:"voting_deadline,omitempty"`
}

type TimeSlotResponse struct {
	ID          string    `json:"id"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Description string    `json:"description"`
	VoteCount   int       `json:"vote_count"`
}

type RestaurantOptionResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Address     string  `json:"address"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	CuisineType string  `json:"cuisine_type"`
	VoteCount   int     `json:"vote_count"`
}

type ParticipantResponse struct {
	UserID      string    `json:"user_id"`
	DisplayName string    `json:"display_name"`
	JoinedAt    time.Time `json:"joined_at"`
	HasVoted    bool      `json:"has_voted"`
}

type VoteResponse struct {
	ID       string          `json:"id"`
	PlanID   string          `json:"plan_id"`
	UserID   string          `json:"user_id"`
	Choices  []VoteChoice    `json:"choices"`
	Comment  string          `json:"comment,omitempty"`
	VotedAt  time.Time       `json:"voted_at"`
}

type VoteChoice struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	OptionID string `json:"option_id"`
}

type VotingResultsResponse struct {
	TotalParticipants int                          `json:"total_participants"`
	VotedParticipants int                          `json:"voted_participants"`
	VotingProgress    float64                      `json:"voting_progress"`
	TimeSlots         []TimeSlotResponse           `json:"time_slots"`
	Restaurants       []RestaurantOptionResponse   `json:"restaurants"`
}

func ToGroupDiningPlanResponse(plan *aggregates.GroupDiningPlan) *GroupDiningPlanResponse {
	timeSlots := make([]TimeSlotResponse, len(plan.TimeSlots))
	for i, ts := range plan.TimeSlots {
		timeSlots[i] = TimeSlotResponse{
			ID:          ts.ID,
			StartTime:   ts.StartTime,
			EndTime:     ts.EndTime,
			Description: ts.Description,
			VoteCount:   ts.VoteCount,
		}
	}

	restaurants := make([]RestaurantOptionResponse, len(plan.RestaurantOptions))
	for i, ro := range plan.RestaurantOptions {
		restaurants[i] = RestaurantOptionResponse{
			ID:          ro.ID,
			Name:        ro.Name,
			Address:     ro.Address,
			Latitude:    ro.Latitude,
			Longitude:   ro.Longitude,
			CuisineType: ro.CuisineType,
			VoteCount:   ro.VoteCount,
		}
	}

	participants := make([]ParticipantResponse, len(plan.Participants))
	for i, p := range plan.Participants {
		participants[i] = ParticipantResponse{
			UserID:      p.UserID,
			DisplayName: p.DisplayName,
			JoinedAt:    p.JoinedAt,
			HasVoted:    p.HasVoted,
		}
	}

	response := &GroupDiningPlanResponse{
		ID:                plan.ID,
		CreatedBy:         plan.CreatedBy,
		Title:             plan.Title,
		Description:       plan.Description,
		Status:            string(plan.Status),
		TimeSlots:         timeSlots,
		RestaurantOptions: restaurants,
		Participants:      participants,
		CreatedAt:         plan.CreatedAt,
		UpdatedAt:         plan.UpdatedAt,
		VotingDeadline:    plan.VotingDeadline,
	}

	if plan.ConfirmedTimeSlot != nil {
		response.ConfirmedTimeSlot = &TimeSlotResponse{
			ID:          plan.ConfirmedTimeSlot.ID,
			StartTime:   plan.ConfirmedTimeSlot.StartTime,
			EndTime:     plan.ConfirmedTimeSlot.EndTime,
			Description: plan.ConfirmedTimeSlot.Description,
			VoteCount:   plan.ConfirmedTimeSlot.VoteCount,
		}
	}

	if plan.ConfirmedRestaurant != nil {
		response.ConfirmedRestaurant = &RestaurantOptionResponse{
			ID:          plan.ConfirmedRestaurant.ID,
			Name:        plan.ConfirmedRestaurant.Name,
			Address:     plan.ConfirmedRestaurant.Address,
			Latitude:    plan.ConfirmedRestaurant.Latitude,
			Longitude:   plan.ConfirmedRestaurant.Longitude,
			CuisineType: plan.ConfirmedRestaurant.CuisineType,
			VoteCount:   plan.ConfirmedRestaurant.VoteCount,
		}
	}

	return response
}

func ToVoteResponse(vote *aggregates.Vote) *VoteResponse {
	choices := make([]VoteChoice, len(vote.Choices))
	for i, choice := range vote.Choices {
		choices[i] = VoteChoice{
			ID:       choice.ID,
			Type:     string(choice.Type),
			OptionID: choice.OptionID,
		}
	}

	return &VoteResponse{
		ID:      vote.ID,
		PlanID:  vote.PlanID,
		UserID:  vote.UserID,
		Choices: choices,
		Comment: vote.Comment,
		VotedAt: vote.VotedAt,
	}
}