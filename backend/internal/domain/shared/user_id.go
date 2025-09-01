package shared

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// ID represents a generic ID type
type ID struct {
	value string
}

func NewID() ID {
	return ID{
		value: uuid.New().String(),
	}
}

func ParseID(id string) (ID, error) {
	if strings.TrimSpace(id) == "" {
		return ID{}, errors.New("ID cannot be empty")
	}
	
	// 驗證是否為有效的 UUID
	if _, err := uuid.Parse(id); err != nil {
		return ID{}, fmt.Errorf("invalid ID format: %w", err)
	}
	
	return ID{value: id}, nil
}

func (i ID) String() string {
	return i.value
}

func (i ID) Equals(other ID) bool {
	return i.value == other.value
}

func (i ID) IsEmpty() bool {
	return i.value == ""
}

// JSON marshaling for ID
func (i ID) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.value)
}

func (i *ID) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	
	id, err := ParseID(value)
	if err != nil {
		return err
	}
	
	*i = id
	return nil
}

type UserID struct {
	value string
}

func NewUserID() UserID {
	return UserID{
		value: uuid.New().String(),
	}
}

func ParseUserID(id string) (UserID, error) {
	return NewUserIDFromString(id)
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

type FriendshipID struct {
	value string
}

func NewFriendshipID() FriendshipID {
	return FriendshipID{
		value: uuid.New().String(),
	}
}

func NewFriendshipIDFromString(id string) (FriendshipID, error) {
	if strings.TrimSpace(id) == "" {
		return FriendshipID{}, errors.New("friendship ID cannot be empty")
	}
	
	// 驗證是否為有效的 UUID
	if _, err := uuid.Parse(id); err != nil {
		return FriendshipID{}, fmt.Errorf("invalid friendship ID format: %w", err)
	}
	
	return FriendshipID{value: id}, nil
}

func (f FriendshipID) String() string {
	return f.value
}

func (f FriendshipID) Equals(other FriendshipID) bool {
	return f.value == other.value
}

func (f FriendshipID) IsEmpty() bool {
	return f.value == ""
}

// JSON marshaling for UserID
func (u UserID) MarshalJSON() ([]byte, error) {
	return json.Marshal(u.value)
}

func (u *UserID) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	
	userID, err := NewUserIDFromString(value)
	if err != nil {
		return err
	}
	
	*u = userID
	return nil
}

// JSON marshaling for FriendshipID
func (f FriendshipID) MarshalJSON() ([]byte, error) {
	return json.Marshal(f.value)
}

func (f *FriendshipID) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	
	friendshipID, err := NewFriendshipIDFromString(value)
	if err != nil {
		return err
	}
	
	*f = friendshipID
	return nil
}