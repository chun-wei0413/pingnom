package activity

import (
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// ActivityStatus represents the status of an activity
type ActivityStatus int

const (
	ActivityStatusPending ActivityStatus = iota
	ActivityStatusCompleted
	ActivityStatusCancelled
)

func (s ActivityStatus) String() string {
	switch s {
	case ActivityStatusPending:
		return "pending"
	case ActivityStatusCompleted:
		return "completed"
	case ActivityStatusCancelled:
		return "cancelled"
	default:
		return "unknown"
	}
}

// ActivityHistory represents a historical record of a dining activity
type ActivityHistory struct {
	id              ActivityHistoryID
	userID          shared.UserID
	groupDiningID   string // Reference to Group Dining Plan ID
	restaurantID    string // Reference to Restaurant ID
	restaurantName  string
	attendedAt      time.Time
	status          ActivityStatus
	participants    int
	notes           string
	createdAt       time.Time
	updatedAt       time.Time
}

// NewActivityHistory creates a new activity history
func NewActivityHistory(
	userID shared.UserID,
	groupDiningID string,
	restaurantID string,
	restaurantName string,
	attendedAt time.Time,
	participants int,
) (*ActivityHistory, error) {
	if userID.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}
	
	if groupDiningID == "" {
		return nil, shared.ErrInvalidInput
	}
	
	if restaurantID == "" || restaurantName == "" {
		return nil, shared.ErrInvalidInput
	}
	
	if participants <= 0 {
		return nil, shared.ErrInvalidInput
	}

	now := time.Now()
	
	return &ActivityHistory{
		id:             NewActivityHistoryID(),
		userID:         userID,
		groupDiningID:  groupDiningID,
		restaurantID:   restaurantID,
		restaurantName: restaurantName,
		attendedAt:     attendedAt,
		status:         ActivityStatusPending,
		participants:   participants,
		notes:          "",
		createdAt:      now,
		updatedAt:      now,
	}, nil
}

// Getters
func (a *ActivityHistory) ID() ActivityHistoryID {
	return a.id
}

func (a *ActivityHistory) UserID() shared.UserID {
	return a.userID
}

func (a *ActivityHistory) GroupDiningID() string {
	return a.groupDiningID
}

func (a *ActivityHistory) RestaurantID() string {
	return a.restaurantID
}

func (a *ActivityHistory) RestaurantName() string {
	return a.restaurantName
}

func (a *ActivityHistory) AttendedAt() time.Time {
	return a.attendedAt
}

func (a *ActivityHistory) Status() ActivityStatus {
	return a.status
}

func (a *ActivityHistory) Participants() int {
	return a.participants
}

func (a *ActivityHistory) Notes() string {
	return a.notes
}

func (a *ActivityHistory) CreatedAt() time.Time {
	return a.createdAt
}

func (a *ActivityHistory) UpdatedAt() time.Time {
	return a.updatedAt
}

// Business Methods
func (a *ActivityHistory) MarkAsCompleted(notes string) {
	a.status = ActivityStatusCompleted
	a.notes = notes
	a.updatedAt = time.Now()
}

func (a *ActivityHistory) MarkAsCancelled(reason string) {
	a.status = ActivityStatusCancelled
	a.notes = reason
	a.updatedAt = time.Now()
}

func (a *ActivityHistory) UpdateNotes(notes string) {
	a.notes = notes
	a.updatedAt = time.Now()
}

func (a *ActivityHistory) IsCompleted() bool {
	return a.status == ActivityStatusCompleted
}

func (a *ActivityHistory) IsCancelled() bool {
	return a.status == ActivityStatusCancelled
}

func (a *ActivityHistory) UpdateStatus(status ActivityStatus) error {
	switch status {
	case ActivityStatusPending, ActivityStatusCompleted, ActivityStatusCancelled:
		a.status = status
		a.updatedAt = time.Now()
		return nil
	default:
		return shared.ErrInvalidActivityStatus
	}
}

func (a *ActivityHistory) UpdateParticipants(participants int) error {
	if participants <= 0 {
		return shared.ErrInvalidParticipants
	}
	a.participants = participants
	a.updatedAt = time.Now()
	return nil
}