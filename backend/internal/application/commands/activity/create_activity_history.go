package activity

import (
	"context"
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// CreateActivityHistoryCommand represents the command to create activity history
type CreateActivityHistoryCommand struct {
	UserID         shared.UserID
	GroupDiningID  string
	RestaurantID   string
	RestaurantName string
	AttendedAt     time.Time
	Participants   int
}

// CreateActivityHistoryHandler handles the creation of activity history
type CreateActivityHistoryHandler struct {
	repo activity.ActivityHistoryRepository
}

// NewCreateActivityHistoryHandler creates a new handler
func NewCreateActivityHistoryHandler(repo activity.ActivityHistoryRepository) *CreateActivityHistoryHandler {
	return &CreateActivityHistoryHandler{
		repo: repo,
	}
}

// Handle processes the create activity history command
func (h *CreateActivityHistoryHandler) Handle(ctx context.Context, cmd CreateActivityHistoryCommand) (*activity.ActivityHistory, error) {
	// Create new activity history
	activityHistory, err := activity.NewActivityHistory(
		cmd.UserID,
		cmd.GroupDiningID,
		cmd.RestaurantID,
		cmd.RestaurantName,
		cmd.AttendedAt,
		cmd.Participants,
	)
	if err != nil {
		return nil, err
	}

	// Save to repository
	if err := h.repo.Save(ctx, activityHistory); err != nil {
		return nil, err
	}

	return activityHistory, nil
}