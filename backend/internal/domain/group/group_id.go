package group

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// GroupID 代表群組的唯一識別符
type GroupID struct {
	value string
}

// NewGroupID 產生新的群組 ID
func NewGroupID() GroupID {
	return GroupID{
		value: uuid.New().String(),
	}
}

// NewGroupIDFromString 從字串建立群組 ID
func NewGroupIDFromString(id string) (GroupID, error) {
	if strings.TrimSpace(id) == "" {
		return GroupID{}, errors.New("group ID cannot be empty")
	}
	
	// 驗證是否為有效的 UUID 格式
	if _, err := uuid.Parse(id); err != nil {
		return GroupID{}, fmt.Errorf("invalid group ID format: %w", err)
	}
	
	return GroupID{value: id}, nil
}

// String 返回字串表示
func (g GroupID) String() string {
	return g.value
}

// Equals 檢查兩個群組 ID 是否相等
func (g GroupID) Equals(other GroupID) bool {
	return g.value == other.value
}

// IsEmpty 檢查群組 ID 是否為空
func (g GroupID) IsEmpty() bool {
	return g.value == ""
}

// JSON marshaling for GroupID
func (g GroupID) MarshalJSON() ([]byte, error) {
	return json.Marshal(g.value)
}

func (g *GroupID) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	
	groupID, err := NewGroupIDFromString(value)
	if err != nil {
		return err
	}
	
	*g = groupID
	return nil
}