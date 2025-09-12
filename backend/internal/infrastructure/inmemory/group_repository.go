package inmemory

import (
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/group"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// InMemoryGroupRepository implements the GroupRepository interface using in-memory storage
type InMemoryGroupRepository struct {
	groups map[string]*group.Group // key: groupID string
	mutex  sync.RWMutex
}

// NewInMemoryGroupRepository creates a new in-memory group repository
func NewInMemoryGroupRepository() *InMemoryGroupRepository {
	return &InMemoryGroupRepository{
		groups: make(map[string]*group.Group),
		mutex:  sync.RWMutex{},
	}
}

// Create stores a new group in memory
func (r *InMemoryGroupRepository) Create(g *group.Group) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Check if group already exists
	if _, exists := r.groups[g.ID.String()]; exists {
		return errors.New("group already exists")
	}

	// Store group
	r.groups[g.ID.String()] = g
	return nil
}

// GetByID retrieves a group by its ID
func (r *InMemoryGroupRepository) GetByID(id group.GroupID) (*group.Group, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	g, exists := r.groups[id.String()]
	if !exists {
		return nil, errors.New("group not found")
	}

	return g, nil
}

// GetByCreatorID retrieves groups created by a specific user
func (r *InMemoryGroupRepository) GetByCreatorID(creatorID shared.UserID) ([]*group.Group, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var result []*group.Group
	for _, g := range r.groups {
		if g.CreatorID.Equals(creatorID) {
			result = append(result, g)
		}
	}

	return result, nil
}

// GetByMemberID retrieves groups where the user is a member
func (r *InMemoryGroupRepository) GetByMemberID(memberID shared.UserID) ([]*group.Group, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var result []*group.Group
	for _, g := range r.groups {
		if g.IsMember(memberID) {
			result = append(result, g)
		}
	}

	return result, nil
}

// GetActiveGroups retrieves active groups with pagination
func (r *InMemoryGroupRepository) GetActiveGroups(offset, limit int) ([]*group.Group, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var activeGroups []*group.Group
	for _, g := range r.groups {
		if g.Status == group.StatusActive {
			activeGroups = append(activeGroups, g)
		}
	}

	// Simple pagination
	start := offset
	if start > len(activeGroups) {
		return []*group.Group{}, nil
	}

	end := start + limit
	if end > len(activeGroups) {
		end = len(activeGroups)
	}

	return activeGroups[start:end], nil
}

// Update updates an existing group
func (r *InMemoryGroupRepository) Update(g *group.Group) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.groups[g.ID.String()]; !exists {
		return errors.New("group not found")
	}

	// Update timestamp
	g.UpdatedAt = time.Now()

	// Store updated group
	r.groups[g.ID.String()] = g
	return nil
}

// Delete removes a group from memory
func (r *InMemoryGroupRepository) Delete(id group.GroupID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.groups[id.String()]; !exists {
		return errors.New("group not found")
	}

	delete(r.groups, id.String())
	return nil
}

// SearchByName searches groups by name
func (r *InMemoryGroupRepository) SearchByName(name string, offset, limit int) ([]*group.Group, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var matchedGroups []*group.Group
	searchTerm := strings.ToLower(name)

	for _, g := range r.groups {
		if strings.Contains(strings.ToLower(g.Name), searchTerm) {
			matchedGroups = append(matchedGroups, g)
		}
	}

	// Simple pagination
	start := offset
	if start > len(matchedGroups) {
		return []*group.Group{}, nil
	}

	end := start + limit
	if end > len(matchedGroups) {
		end = len(matchedGroups)
	}

	return matchedGroups[start:end], nil
}

// GetGroupStats retrieves statistics for a group
func (r *InMemoryGroupRepository) GetGroupStats(id group.GroupID) (*group.GroupStats, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	g, exists := r.groups[id.String()]
	if !exists {
		return nil, errors.New("group not found")
	}

	// Calculate statistics
	totalMembers := len(g.Members)
	activeMembers := g.GetMemberCount()

	// Calculate last activity days ago
	lastActivityDaysAgo := 0
	if g.LastActivityAt != nil {
		duration := time.Since(*g.LastActivityAt)
		lastActivityDaysAgo = int(duration.Hours() / 24)
	} else {
		// If no activity recorded, calculate from creation date
		duration := time.Since(g.CreatedAt)
		lastActivityDaysAgo = int(duration.Hours() / 24)
	}

	// For simplicity, activities this month = activity count (in real implementation, this would be filtered by date)
	activitiesThisMonth := g.ActivityCount
	if activitiesThisMonth > 30 {
		activitiesThisMonth = 30 // Mock value for this month
	}

	return &group.GroupStats{
		GroupID:              id,
		TotalMembers:         totalMembers,
		ActiveMembers:        activeMembers,
		TotalActivities:      g.ActivityCount,
		ActivitiesThisMonth:  activitiesThisMonth,
		LastActivityDaysAgo:  lastActivityDaysAgo,
	}, nil
}