package ping

import (
	"context"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// RespondToPingCommand represents the command to respond to a ping
type RespondToPingCommand struct {
	PingID  shared.ID            `json:"pingId" validate:"required"`
	UserID  shared.UserID        `json:"userId" validate:"required"`
	Status  ping.ResponseStatus  `json:"status" validate:"required,oneof=accepted declined"`
	Message string               `json:"message" validate:"max=200"`
}

// RespondToPingResult represents the result of responding to a ping
type RespondToPingResult struct {
	PingID      shared.ID            `json:"pingId"`
	UserID      shared.UserID        `json:"userId"`
	Status      ping.ResponseStatus  `json:"status"`
	Message     string               `json:"message"`
	RespondedAt time.Time            `json:"respondedAt"`
}

// RespondToPingHandler handles responses to ping invitations
type RespondToPingHandler struct {
	pingService *ping.Service
}

// NewRespondToPingHandler creates a new respond to ping handler
func NewRespondToPingHandler(pingService *ping.Service) *RespondToPingHandler {
	return &RespondToPingHandler{
		pingService: pingService,
	}
}

// Handle processes the respond to ping command
func (h *RespondToPingHandler) Handle(ctx context.Context, cmd RespondToPingCommand) (*RespondToPingResult, error) {
	// Respond to the ping using domain service
	ping, err := h.pingService.RespondToPing(
		ctx,
		cmd.PingID,
		cmd.UserID,
		cmd.Status,
		cmd.Message,
	)
	if err != nil {
		return nil, err
	}

	// Find the user's response to get the timestamp
	var respondedAt time.Time
	for _, response := range ping.Responses() {
		if response.UserID == cmd.UserID {
			if response.RespondedAt != nil {
				respondedAt = *response.RespondedAt
			}
			break
		}
	}

	// Return result
	return &RespondToPingResult{
		PingID:      ping.ID(),
		UserID:      cmd.UserID,
		Status:      cmd.Status,
		Message:     cmd.Message,
		RespondedAt: respondedAt,
	}, nil
}