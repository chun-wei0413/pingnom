package aggregates

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// VoteType represents the type of vote (time or restaurant)
type VoteType string

const (
	VoteTypeTime       VoteType = "time"
	VoteTypeRestaurant VoteType = "restaurant"
)

// VoteChoice represents a single vote choice
type VoteChoice struct {
	ID       string   `json:"id"`
	Type     VoteType `json:"type"`
	OptionID string   `json:"option_id"`
}

// Vote represents a participant's vote for a group dining plan
type Vote struct {
	ID       string       `json:"id"`
	PlanID   string       `json:"plan_id"`
	UserID   string       `json:"user_id"`
	Choices  []VoteChoice `json:"choices"`
	Comment  string       `json:"comment,omitempty"`
	VotedAt  time.Time    `json:"voted_at"`
}

// NewVote creates a new vote for a group dining plan
func NewVote(planID, userID string) (*Vote, error) {
	if planID == "" {
		return nil, errors.New("plan ID cannot be empty")
	}
	if userID == "" {
		return nil, errors.New("user ID cannot be empty")
	}

	vote := &Vote{
		ID:      uuid.New().String(),
		PlanID:  planID,
		UserID:  userID,
		Choices: make([]VoteChoice, 0),
		VotedAt: time.Now(),
	}

	return vote, nil
}

// AddTimeChoice adds a time slot choice to the vote
func (v *Vote) AddTimeChoice(timeSlotID string) error {
	if timeSlotID == "" {
		return errors.New("time slot ID cannot be empty")
	}

	// Check if this time slot is already voted for
	for _, choice := range v.Choices {
		if choice.Type == VoteTypeTime && choice.OptionID == timeSlotID {
			return errors.New("time slot already voted for")
		}
	}

	choice := VoteChoice{
		ID:       uuid.New().String(),
		Type:     VoteTypeTime,
		OptionID: timeSlotID,
	}

	v.Choices = append(v.Choices, choice)
	return nil
}

// AddRestaurantChoice adds a restaurant choice to the vote
func (v *Vote) AddRestaurantChoice(restaurantID string) error {
	if restaurantID == "" {
		return errors.New("restaurant ID cannot be empty")
	}

	// Check if this restaurant is already voted for
	for _, choice := range v.Choices {
		if choice.Type == VoteTypeRestaurant && choice.OptionID == restaurantID {
			return errors.New("restaurant already voted for")
		}
	}

	choice := VoteChoice{
		ID:       uuid.New().String(),
		Type:     VoteTypeRestaurant,
		OptionID: restaurantID,
	}

	v.Choices = append(v.Choices, choice)
	return nil
}

// SetComment sets a comment for the vote
func (v *Vote) SetComment(comment string) {
	v.Comment = comment
}

// GetTimeChoices returns all time slot choices in this vote
func (v *Vote) GetTimeChoices() []string {
	var timeChoices []string
	for _, choice := range v.Choices {
		if choice.Type == VoteTypeTime {
			timeChoices = append(timeChoices, choice.OptionID)
		}
	}
	return timeChoices
}

// GetRestaurantChoices returns all restaurant choices in this vote
func (v *Vote) GetRestaurantChoices() []string {
	var restaurantChoices []string
	for _, choice := range v.Choices {
		if choice.Type == VoteTypeRestaurant {
			restaurantChoices = append(restaurantChoices, choice.OptionID)
		}
	}
	return restaurantChoices
}

// IsValid validates the vote has at least one choice
func (v *Vote) IsValid() error {
	if len(v.Choices) == 0 {
		return errors.New("vote must have at least one choice")
	}

	hasTimeChoice := false
	hasRestaurantChoice := false

	for _, choice := range v.Choices {
		if choice.Type == VoteTypeTime {
			hasTimeChoice = true
		}
		if choice.Type == VoteTypeRestaurant {
			hasRestaurantChoice = true
		}
	}

	if !hasTimeChoice {
		return errors.New("vote must include at least one time choice")
	}

	if !hasRestaurantChoice {
		return errors.New("vote must include at least one restaurant choice")
	}

	return nil
}