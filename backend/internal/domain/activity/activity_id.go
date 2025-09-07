package activity

import (
	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// ActivityHistoryID represents the unique identifier for an activity history
type ActivityHistoryID struct {
	value uuid.UUID
}

// NewActivityHistoryID creates a new activity history ID
func NewActivityHistoryID() ActivityHistoryID {
	return ActivityHistoryID{
		value: uuid.New(),
	}
}

// NewActivityHistoryIDFromString creates an activity history ID from string
func NewActivityHistoryIDFromString(s string) (ActivityHistoryID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return ActivityHistoryID{}, shared.ErrInvalidID
	}
	return ActivityHistoryID{value: id}, nil
}

// String returns the string representation of the ID
func (id ActivityHistoryID) String() string {
	return id.value.String()
}

// Equals compares two activity history IDs
func (id ActivityHistoryID) Equals(other ActivityHistoryID) bool {
	return id.value == other.value
}

// IsEmpty checks if the ID is empty
func (id ActivityHistoryID) IsEmpty() bool {
	return id.value == uuid.Nil
}