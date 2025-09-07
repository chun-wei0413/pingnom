package activity

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// UpdateActivityHistoryCommand represents the command to update activity history
type UpdateActivityHistoryCommand struct {
	ID           activity.ActivityHistoryID
	UserID       shared.UserID
	Status       activity.ActivityStatus
	Notes        string
	Participants int
}

// UpdateActivityHistoryHandler handles the updating of activity history
type UpdateActivityHistoryHandler struct {
	repo activity.ActivityHistoryRepository
}

// NewUpdateActivityHistoryHandler creates a new handler
func NewUpdateActivityHistoryHandler(repo activity.ActivityHistoryRepository) *UpdateActivityHistoryHandler {
	return &UpdateActivityHistoryHandler{
		repo: repo,
	}
}

// Handle processes the update activity history command
func (h *UpdateActivityHistoryHandler) Handle(ctx context.Context, cmd UpdateActivityHistoryCommand) (*activity.ActivityHistory, error) {
	// Get existing activity history
	existing, err := h.repo.GetByID(ctx, cmd.ID)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if existing.UserID() != cmd.UserID {
		return nil, shared.ErrUnauthorized
	}

	// Update fields
	if err := existing.UpdateStatus(cmd.Status); err != nil {
		return nil, err
	}

	if cmd.Notes != "" {
		existing.UpdateNotes(cmd.Notes)
	}

	if cmd.Participants > 0 {
		if err := existing.UpdateParticipants(cmd.Participants); err != nil {
			return nil, err
		}
	}

	// Save changes
	if err := h.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}