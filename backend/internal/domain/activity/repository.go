package activity

import (
	"context"
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// ActivityHistoryRepository defines the interface for activity history persistence
type ActivityHistoryRepository interface {
	// Save stores an activity history
	Save(ctx context.Context, activity *ActivityHistory) error
	
	// GetByID retrieves an activity history by its ID
	GetByID(ctx context.Context, id ActivityHistoryID) (*ActivityHistory, error)
	
	// GetByUserID retrieves all activity histories for a user
	GetByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*ActivityHistory, error)
	
	// GetByUserIDAndStatus retrieves activity histories for a user with specific status
	GetByUserIDAndStatus(ctx context.Context, userID shared.UserID, status ActivityStatus, limit, offset int) ([]*ActivityHistory, error)
	
	// GetByRestaurantID retrieves all activity histories for a restaurant
	GetByRestaurantID(ctx context.Context, restaurantID string, limit, offset int) ([]*ActivityHistory, error)
	
	// GetByDateRange retrieves activity histories within a date range
	GetByDateRange(ctx context.Context, userID shared.UserID, startDate, endDate time.Time) ([]*ActivityHistory, error)
	
	// Update updates an existing activity history
	Update(ctx context.Context, activity *ActivityHistory) error
	
	// Delete removes an activity history
	Delete(ctx context.Context, id ActivityHistoryID) error
	
	// GetUserActivityCount returns total activity count for a user
	GetUserActivityCount(ctx context.Context, userID shared.UserID) (int, error)
	
	// GetUserActivityCountByStatus returns activity count by status for a user
	GetUserActivityCountByStatus(ctx context.Context, userID shared.UserID, status ActivityStatus) (int, error)
}