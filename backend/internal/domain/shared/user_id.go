package shared

import (
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type UserID struct {
	value string
}

func NewUserID() UserID {
	return UserID{
		value: uuid.New().String(),
	}
}

func NewUserIDFromString(id string) (UserID, error) {
	if strings.TrimSpace(id) == "" {
		return UserID{}, errors.New("user ID cannot be empty")
	}
	
	// 驗證是否為有效的 UUID
	if _, err := uuid.Parse(id); err != nil {
		return UserID{}, fmt.Errorf("invalid user ID format: %w", err)
	}
	
	return UserID{value: id}, nil
}

func (u UserID) String() string {
	return u.value
}

func (u UserID) Equals(other UserID) bool {
	return u.value == other.value
}

func (u UserID) IsEmpty() bool {
	return u.value == ""
}