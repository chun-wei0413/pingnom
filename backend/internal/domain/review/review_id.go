package review

import (
	"github.com/google/uuid"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// ReviewID represents the unique identifier for a restaurant review
type ReviewID struct {
	value uuid.UUID
}

// NewReviewID creates a new review ID
func NewReviewID() ReviewID {
	return ReviewID{
		value: uuid.New(),
	}
}

// NewReviewIDFromString creates a review ID from string
func NewReviewIDFromString(s string) (ReviewID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return ReviewID{}, shared.ErrInvalidID
	}
	return ReviewID{value: id}, nil
}

// String returns the string representation of the ID
func (id ReviewID) String() string {
	return id.value.String()
}

// Equals compares two review IDs
func (id ReviewID) Equals(other ReviewID) bool {
	return id.value == other.value
}

// IsEmpty checks if the ID is empty
func (id ReviewID) IsEmpty() bool {
	return id.value == uuid.Nil
}