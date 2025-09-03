package aggregates

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// PlanStatus represents the status of a group dining plan
type PlanStatus string

const (
	PlanStatusCreated   PlanStatus = "created"
	PlanStatusVoting    PlanStatus = "voting" 
	PlanStatusConfirmed PlanStatus = "confirmed"
	PlanStatusCancelled PlanStatus = "cancelled"
)

// TimeSlot represents a proposed time for the group dining
type TimeSlot struct {
	ID          string    `json:"id"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Description string    `json:"description"`
	VoteCount   int       `json:"vote_count"`
}

// RestaurantOption represents a proposed restaurant for the group dining
type RestaurantOption struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Address     string  `json:"address"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	CuisineType string  `json:"cuisine_type"`
	VoteCount   int     `json:"vote_count"`
}

// Participant represents a participant in the group dining plan
type Participant struct {
	UserID      string    `json:"user_id"`
	DisplayName string    `json:"display_name"`
	JoinedAt    time.Time `json:"joined_at"`
	HasVoted    bool      `json:"has_voted"`
}

// GroupDiningPlan is the root aggregate for group dining planning
type GroupDiningPlan struct {
	ID                string              `json:"id"`
	CreatedBy         string              `json:"created_by"`
	Title             string              `json:"title"`
	Description       string              `json:"description"`
	Status            PlanStatus          `json:"status"`
	TimeSlots         []TimeSlot          `json:"time_slots"`
	RestaurantOptions []RestaurantOption  `json:"restaurant_options"`
	Participants      []Participant       `json:"participants"`
	ConfirmedTimeSlot *TimeSlot          `json:"confirmed_time_slot,omitempty"`
	ConfirmedRestaurant *RestaurantOption `json:"confirmed_restaurant,omitempty"`
	CreatedAt         time.Time           `json:"created_at"`
	UpdatedAt         time.Time           `json:"updated_at"`
	VotingDeadline    *time.Time         `json:"voting_deadline,omitempty"`
}

// NewGroupDiningPlan creates a new group dining plan
func NewGroupDiningPlan(createdBy, title, description string) (*GroupDiningPlan, error) {
	if createdBy == "" {
		return nil, errors.New("creator ID cannot be empty")
	}
	if title == "" {
		return nil, errors.New("title cannot be empty")
	}

	now := time.Now()
	plan := &GroupDiningPlan{
		ID:                uuid.New().String(),
		CreatedBy:         createdBy,
		Title:             title,
		Description:       description,
		Status:            PlanStatusCreated,
		TimeSlots:         make([]TimeSlot, 0),
		RestaurantOptions: make([]RestaurantOption, 0),
		Participants:      make([]Participant, 0),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	// Add creator as first participant
	plan.AddParticipant(createdBy, "Creator")

	return plan, nil
}

// AddTimeSlot adds a time slot option to the plan
func (p *GroupDiningPlan) AddTimeSlot(startTime, endTime time.Time, description string) error {
	if p.Status != PlanStatusCreated {
		return errors.New("cannot add time slots after plan is finalized")
	}

	if startTime.After(endTime) {
		return errors.New("start time cannot be after end time")
	}

	timeSlot := TimeSlot{
		ID:          uuid.New().String(),
		StartTime:   startTime,
		EndTime:     endTime,
		Description: description,
		VoteCount:   0,
	}

	p.TimeSlots = append(p.TimeSlots, timeSlot)
	p.UpdatedAt = time.Now()

	return nil
}

// AddRestaurantOption adds a restaurant option to the plan
func (p *GroupDiningPlan) AddRestaurantOption(name, address string, lat, lng float64, cuisineType string) error {
	if p.Status != PlanStatusCreated {
		return errors.New("cannot add restaurant options after plan is finalized")
	}

	if name == "" {
		return errors.New("restaurant name cannot be empty")
	}

	restaurant := RestaurantOption{
		ID:          uuid.New().String(),
		Name:        name,
		Address:     address,
		Latitude:    lat,
		Longitude:   lng,
		CuisineType: cuisineType,
		VoteCount:   0,
	}

	p.RestaurantOptions = append(p.RestaurantOptions, restaurant)
	p.UpdatedAt = time.Now()

	return nil
}

// AddParticipant adds a participant to the group dining plan
func (p *GroupDiningPlan) AddParticipant(userID, displayName string) error {
	if userID == "" {
		return errors.New("user ID cannot be empty")
	}

	// Check if user is already a participant
	for _, participant := range p.Participants {
		if participant.UserID == userID {
			return errors.New("user is already a participant")
		}
	}

	participant := Participant{
		UserID:      userID,
		DisplayName: displayName,
		JoinedAt:    time.Now(),
		HasVoted:    false,
	}

	p.Participants = append(p.Participants, participant)
	p.UpdatedAt = time.Now()

	return nil
}

// StartVoting starts the voting process for the plan
func (p *GroupDiningPlan) StartVoting(deadline *time.Time) error {
	if p.Status != PlanStatusCreated {
		return errors.New("can only start voting for created plans")
	}

	if len(p.TimeSlots) == 0 {
		return errors.New("cannot start voting without time slots")
	}

	if len(p.RestaurantOptions) == 0 {
		return errors.New("cannot start voting without restaurant options")
	}

	if len(p.Participants) <= 1 {
		return errors.New("cannot start voting with less than 2 participants")
	}

	p.Status = PlanStatusVoting
	p.VotingDeadline = deadline
	p.UpdatedAt = time.Now()

	return nil
}

// RecordVote records a participant's vote
func (p *GroupDiningPlan) RecordVote(userID string, timeSlotIDs, restaurantIDs []string) error {
	if p.Status != PlanStatusVoting {
		return errors.New("voting is not active for this plan")
	}

	// Check if user is a participant
	participantIndex := -1
	for i, participant := range p.Participants {
		if participant.UserID == userID {
			participantIndex = i
			break
		}
	}

	if participantIndex == -1 {
		return errors.New("user is not a participant in this plan")
	}

	// Update vote counts for time slots
	for _, timeSlotID := range timeSlotIDs {
		for i, timeSlot := range p.TimeSlots {
			if timeSlot.ID == timeSlotID {
				if !p.Participants[participantIndex].HasVoted {
					p.TimeSlots[i].VoteCount++
				}
				break
			}
		}
	}

	// Update vote counts for restaurants
	for _, restaurantID := range restaurantIDs {
		for i, restaurant := range p.RestaurantOptions {
			if restaurant.ID == restaurantID {
				if !p.Participants[participantIndex].HasVoted {
					p.RestaurantOptions[i].VoteCount++
				}
				break
			}
		}
	}

	// Mark participant as voted
	p.Participants[participantIndex].HasVoted = true
	p.UpdatedAt = time.Now()

	return nil
}

// ConfirmPlan confirms the final arrangements for the group dining
func (p *GroupDiningPlan) ConfirmPlan(timeSlotID, restaurantID string) error {
	if p.Status != PlanStatusVoting {
		return errors.New("can only confirm plans that are in voting status")
	}

	// Find and set confirmed time slot
	for _, timeSlot := range p.TimeSlots {
		if timeSlot.ID == timeSlotID {
			p.ConfirmedTimeSlot = &timeSlot
			break
		}
	}

	if p.ConfirmedTimeSlot == nil {
		return errors.New("invalid time slot ID")
	}

	// Find and set confirmed restaurant
	for _, restaurant := range p.RestaurantOptions {
		if restaurant.ID == restaurantID {
			p.ConfirmedRestaurant = &restaurant
			break
		}
	}

	if p.ConfirmedRestaurant == nil {
		return errors.New("invalid restaurant ID")
	}

	p.Status = PlanStatusConfirmed
	p.UpdatedAt = time.Now()

	return nil
}

// CancelPlan cancels the group dining plan
func (p *GroupDiningPlan) CancelPlan() error {
	if p.Status == PlanStatusConfirmed {
		return errors.New("cannot cancel confirmed plans")
	}

	p.Status = PlanStatusCancelled
	p.UpdatedAt = time.Now()

	return nil
}

// GetVotingResults returns the voting results summary
func (p *GroupDiningPlan) GetVotingResults() map[string]interface{} {
	totalParticipants := len(p.Participants)
	votedParticipants := 0

	for _, participant := range p.Participants {
		if participant.HasVoted {
			votedParticipants++
		}
	}

	return map[string]interface{}{
		"total_participants": totalParticipants,
		"voted_participants": votedParticipants,
		"voting_progress":    float64(votedParticipants) / float64(totalParticipants) * 100,
		"time_slots":         p.TimeSlots,
		"restaurants":        p.RestaurantOptions,
	}
}

// IsCreator checks if the given user is the creator of the plan
func (p *GroupDiningPlan) IsCreator(userID string) bool {
	return p.CreatedBy == userID
}

// IsParticipant checks if the given user is a participant in the plan
func (p *GroupDiningPlan) IsParticipant(userID string) bool {
	for _, participant := range p.Participants {
		if participant.UserID == userID {
			return true
		}
	}
	return false
}