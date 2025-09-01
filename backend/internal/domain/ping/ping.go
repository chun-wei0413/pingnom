package ping

import (
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// PingType represents different types of meals
type PingType string

const (
	PingTypeBreakfast PingType = "breakfast"
	PingTypeLunch     PingType = "lunch"
	PingTypeDinner    PingType = "dinner"
	PingTypeSnack     PingType = "snack"
)

// PingStatus represents the status of a ping
type PingStatus string

const (
	PingStatusActive    PingStatus = "active"
	PingStatusCancelled PingStatus = "cancelled"
	PingStatusCompleted PingStatus = "completed"
	PingStatusExpired   PingStatus = "expired"
)

// ResponseStatus represents how a user responded to a ping
type ResponseStatus string

const (
	ResponseStatusPending  ResponseStatus = "pending"
	ResponseStatusAccepted ResponseStatus = "accepted"
	ResponseStatusDeclined ResponseStatus = "declined"
)

// PingResponse represents a user's response to a ping invitation
type PingResponse struct {
	ID         shared.ID      `json:"id"`
	PingID     shared.ID      `json:"pingId"`
	UserID     shared.UserID  `json:"userId"`
	Status     ResponseStatus `json:"status"`
	Message    string         `json:"message,omitempty"`
	RespondedAt *time.Time     `json:"respondedAt,omitempty"`
}

// Ping represents a meal invitation aggregate root
type Ping struct {
	id          shared.ID
	createdBy   shared.UserID
	title       string
	description string
	pingType    PingType
	status      PingStatus
	scheduledAt time.Time
	location    *shared.Location
	responses   []PingResponse
	invitees    []shared.UserID
	createdAt   time.Time
	updatedAt   time.Time
}

// NewPing creates a new ping invitation
func NewPing(
	createdBy shared.UserID,
	title string,
	description string,
	pingType PingType,
	scheduledAt time.Time,
	invitees []shared.UserID,
) (*Ping, error) {
	// Validation
	if createdBy.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}
	
	if title == "" {
		return nil, shared.ErrInvalidInput
	}
	
	if scheduledAt.Before(time.Now()) {
		return nil, shared.ErrInvalidPingTime
	}
	
	if len(invitees) == 0 {
		return nil, shared.ErrInvalidInput
	}

	// Check for self-invitation
	for _, invitee := range invitees {
		if invitee == createdBy {
			return nil, shared.ErrSelfFriendRequest // Reuse similar error
		}
	}

	id := shared.NewID()
	now := time.Now()

	// Initialize responses for all invitees
	responses := make([]PingResponse, len(invitees))
	for i, invitee := range invitees {
		responses[i] = PingResponse{
			ID:      shared.NewID(),
			PingID:  id,
			UserID:  invitee,
			Status:  ResponseStatusPending,
			Message: "",
		}
	}

	return &Ping{
		id:          id,
		createdBy:   createdBy,
		title:       title,
		description: description,
		pingType:    pingType,
		status:      PingStatusActive,
		scheduledAt: scheduledAt,
		responses:   responses,
		invitees:    invitees,
		createdAt:   now,
		updatedAt:   now,
	}, nil
}

// Getters
func (p *Ping) ID() shared.ID { return p.id }
func (p *Ping) CreatedBy() shared.UserID { return p.createdBy }
func (p *Ping) Title() string { return p.title }
func (p *Ping) Description() string { return p.description }
func (p *Ping) PingType() PingType { return p.pingType }
func (p *Ping) Status() PingStatus { return p.status }
func (p *Ping) ScheduledAt() time.Time { return p.scheduledAt }
func (p *Ping) Location() *shared.Location { return p.location }
func (p *Ping) Responses() []PingResponse { return p.responses }
func (p *Ping) Invitees() []shared.UserID { return p.invitees }
func (p *Ping) CreatedAt() time.Time { return p.createdAt }
func (p *Ping) UpdatedAt() time.Time { return p.updatedAt }

// RespondToPing allows a user to respond to the ping invitation
func (p *Ping) RespondToPing(userID shared.UserID, status ResponseStatus, message string) error {
	if p.status != PingStatusActive {
		return shared.ErrPingCancelled
	}

	if time.Now().After(p.scheduledAt) {
		return shared.ErrPingExpired
	}

	// Find the user's response
	for i, response := range p.responses {
		if response.UserID == userID {
			if response.Status != ResponseStatusPending {
				return shared.ErrAlreadyResponded
			}
			
			// Update the response
			now := time.Now()
			p.responses[i].Status = status
			p.responses[i].Message = message
			p.responses[i].RespondedAt = &now
			p.updatedAt = now
			
			return nil
		}
	}

	return shared.ErrEntityNotFound
}

// Cancel cancels the ping
func (p *Ping) Cancel() error {
	if p.status != PingStatusActive {
		return shared.ErrPingCancelled
	}
	
	p.status = PingStatusCancelled
	p.updatedAt = time.Now()
	return nil
}

// Complete marks the ping as completed
func (p *Ping) Complete() error {
	if p.status != PingStatusActive {
		return shared.ErrInvalidInput
	}
	
	p.status = PingStatusCompleted
	p.updatedAt = time.Now()
	return nil
}

// SetLocation updates the ping location
func (p *Ping) SetLocation(location *shared.Location) {
	p.location = location
	p.updatedAt = time.Now()
}

// GetAcceptedCount returns the number of users who accepted the invitation
func (p *Ping) GetAcceptedCount() int {
	count := 0
	for _, response := range p.responses {
		if response.Status == ResponseStatusAccepted {
			count++
		}
	}
	return count
}

// GetPendingCount returns the number of users who haven't responded yet
func (p *Ping) GetPendingCount() int {
	count := 0
	for _, response := range p.responses {
		if response.Status == ResponseStatusPending {
			count++
		}
	}
	return count
}

// IsExpired checks if the ping has expired
func (p *Ping) IsExpired() bool {
	return time.Now().After(p.scheduledAt) && p.status == PingStatusActive
}