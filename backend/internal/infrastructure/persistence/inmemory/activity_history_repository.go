package inmemory

import (
	"context"
	"sync"
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// ActivityHistoryInMemoryRepository implements the activity history repository using in-memory storage
type ActivityHistoryInMemoryRepository struct {
	activities map[string]*activity.ActivityHistory
	mutex      sync.RWMutex
}

// NewActivityHistoryInMemoryRepository creates a new in-memory activity history repository
func NewActivityHistoryInMemoryRepository() *ActivityHistoryInMemoryRepository {
	return &ActivityHistoryInMemoryRepository{
		activities: make(map[string]*activity.ActivityHistory),
	}
}

// Save stores an activity history
func (r *ActivityHistoryInMemoryRepository) Save(ctx context.Context, activity *activity.ActivityHistory) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	r.activities[activity.ID().String()] = activity
	return nil
}

// GetByID retrieves an activity history by its ID
func (r *ActivityHistoryInMemoryRepository) GetByID(ctx context.Context, id activity.ActivityHistoryID) (*activity.ActivityHistory, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	if act, exists := r.activities[id.String()]; exists {
		return act, nil
	}
	return nil, shared.ErrActivityHistoryNotFound
}

// GetByUserID retrieves all activity histories for a user
func (r *ActivityHistoryInMemoryRepository) GetByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*activity.ActivityHistory, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var userActivities []*activity.ActivityHistory
	for _, act := range r.activities {
		if act.UserID() == userID {
			userActivities = append(userActivities, act)
		}
	}
	
	// Sort by attended date (newest first)
	for i := 0; i < len(userActivities)-1; i++ {
		for j := i + 1; j < len(userActivities); j++ {
			if userActivities[i].AttendedAt().Before(userActivities[j].AttendedAt()) {
				userActivities[i], userActivities[j] = userActivities[j], userActivities[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(userActivities) {
		return []*activity.ActivityHistory{}, nil
	}
	
	end := offset + limit
	if end > len(userActivities) {
		end = len(userActivities)
	}
	
	return userActivities[offset:end], nil
}

// GetByUserIDAndStatus retrieves activity histories for a user with specific status
func (r *ActivityHistoryInMemoryRepository) GetByUserIDAndStatus(ctx context.Context, userID shared.UserID, status activity.ActivityStatus, limit, offset int) ([]*activity.ActivityHistory, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var userActivities []*activity.ActivityHistory
	for _, act := range r.activities {
		if act.UserID() == userID && act.Status() == status {
			userActivities = append(userActivities, act)
		}
	}
	
	// Sort by attended date (newest first)
	for i := 0; i < len(userActivities)-1; i++ {
		for j := i + 1; j < len(userActivities); j++ {
			if userActivities[i].AttendedAt().Before(userActivities[j].AttendedAt()) {
				userActivities[i], userActivities[j] = userActivities[j], userActivities[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(userActivities) {
		return []*activity.ActivityHistory{}, nil
	}
	
	end := offset + limit
	if end > len(userActivities) {
		end = len(userActivities)
	}
	
	return userActivities[offset:end], nil
}

// GetByRestaurantID retrieves all activity histories for a restaurant
func (r *ActivityHistoryInMemoryRepository) GetByRestaurantID(ctx context.Context, restaurantID string, limit, offset int) ([]*activity.ActivityHistory, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var restaurantActivities []*activity.ActivityHistory
	for _, act := range r.activities {
		if act.RestaurantID() == restaurantID {
			restaurantActivities = append(restaurantActivities, act)
		}
	}
	
	// Sort by attended date (newest first)
	for i := 0; i < len(restaurantActivities)-1; i++ {
		for j := i + 1; j < len(restaurantActivities); j++ {
			if restaurantActivities[i].AttendedAt().Before(restaurantActivities[j].AttendedAt()) {
				restaurantActivities[i], restaurantActivities[j] = restaurantActivities[j], restaurantActivities[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(restaurantActivities) {
		return []*activity.ActivityHistory{}, nil
	}
	
	end := offset + limit
	if end > len(restaurantActivities) {
		end = len(restaurantActivities)
	}
	
	return restaurantActivities[offset:end], nil
}

// GetByDateRange retrieves activity histories within a date range
func (r *ActivityHistoryInMemoryRepository) GetByDateRange(ctx context.Context, userID shared.UserID, startDate, endDate time.Time) ([]*activity.ActivityHistory, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var userActivities []*activity.ActivityHistory
	for _, act := range r.activities {
		if act.UserID() == userID && 
		   !act.AttendedAt().Before(startDate) && 
		   !act.AttendedAt().After(endDate) {
			userActivities = append(userActivities, act)
		}
	}
	
	// Sort by attended date (newest first)
	for i := 0; i < len(userActivities)-1; i++ {
		for j := i + 1; j < len(userActivities); j++ {
			if userActivities[i].AttendedAt().Before(userActivities[j].AttendedAt()) {
				userActivities[i], userActivities[j] = userActivities[j], userActivities[i]
			}
		}
	}
	
	return userActivities, nil
}

// Update updates an existing activity history
func (r *ActivityHistoryInMemoryRepository) Update(ctx context.Context, activity *activity.ActivityHistory) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.activities[activity.ID().String()]; !exists {
		return shared.ErrActivityHistoryNotFound
	}
	
	r.activities[activity.ID().String()] = activity
	return nil
}

// Delete removes an activity history
func (r *ActivityHistoryInMemoryRepository) Delete(ctx context.Context, id activity.ActivityHistoryID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.activities[id.String()]; !exists {
		return shared.ErrActivityHistoryNotFound
	}
	
	delete(r.activities, id.String())
	return nil
}

// GetUserActivityCount returns total activity count for a user
func (r *ActivityHistoryInMemoryRepository) GetUserActivityCount(ctx context.Context, userID shared.UserID) (int, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	count := 0
	for _, act := range r.activities {
		if act.UserID() == userID {
			count++
		}
	}
	
	return count, nil
}

// GetUserActivityCountByStatus returns activity count by status for a user
func (r *ActivityHistoryInMemoryRepository) GetUserActivityCountByStatus(ctx context.Context, userID shared.UserID, status activity.ActivityStatus) (int, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	count := 0
	for _, act := range r.activities {
		if act.UserID() == userID && act.Status() == status {
			count++
		}
	}
	
	return count, nil
}