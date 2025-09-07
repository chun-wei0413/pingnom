package activity

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// GetUserActivityHistoryQuery represents the query to get user's activity history
type GetUserActivityHistoryQuery struct {
	UserID shared.UserID
	Status activity.ActivityStatus // Optional filter
	Limit  int
	Offset int
}

// GetUserActivityHistoryHandler handles the retrieval of user activity history
type GetUserActivityHistoryHandler struct {
	repo activity.ActivityHistoryRepository
}

// NewGetUserActivityHistoryHandler creates a new handler
func NewGetUserActivityHistoryHandler(repo activity.ActivityHistoryRepository) *GetUserActivityHistoryHandler {
	return &GetUserActivityHistoryHandler{
		repo: repo,
	}
}

// Handle processes the get user activity history query
func (h *GetUserActivityHistoryHandler) Handle(ctx context.Context, query GetUserActivityHistoryQuery) ([]*activity.ActivityHistory, error) {
	// Set default values
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	// Get activities by status if specified  
	var emptyStatus activity.ActivityStatus
	if query.Status != emptyStatus {
		return h.repo.GetByUserIDAndStatus(ctx, query.UserID, query.Status, query.Limit, query.Offset)
	}

	// Get all activities
	return h.repo.GetByUserID(ctx, query.UserID, query.Limit, query.Offset)
}