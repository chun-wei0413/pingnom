package ping

import (
	"context"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// CreatePingCommand represents the command to create a new ping
type CreatePingCommand struct {
	CreatedBy   shared.UserID   `json:"createdBy" validate:"required"`
	Title       string          `json:"title" validate:"required,min=1,max=100"`
	Description string          `json:"description" validate:"max=500"`
	PingType    ping.PingType   `json:"pingType" validate:"required,oneof=breakfast lunch dinner snack"`
	ScheduledAt time.Time       `json:"scheduledAt" validate:"required"`
	Invitees    []shared.UserID `json:"invitees" validate:"required,min=1"`
}

// CreatePingResult represents the result of creating a ping
type CreatePingResult struct {
	PingID      shared.ID       `json:"pingId"`
	Title       string          `json:"title"`
	PingType    ping.PingType   `json:"pingType"`
	ScheduledAt time.Time       `json:"scheduledAt"`
	InviteeCount int            `json:"inviteeCount"`
	CreatedAt   time.Time       `json:"createdAt"`
}

// CreatePingHandler handles the creation of new pings
type CreatePingHandler struct {
	pingService *ping.Service
}

// NewCreatePingHandler creates a new create ping handler
func NewCreatePingHandler(pingService *ping.Service) *CreatePingHandler {
	return &CreatePingHandler{
		pingService: pingService,
	}
}

// Handle processes the create ping command
func (h *CreatePingHandler) Handle(ctx context.Context, cmd CreatePingCommand) (*CreatePingResult, error) {
	// Create the ping using domain service
	ping, err := h.pingService.CreatePing(
		ctx,
		cmd.CreatedBy,
		cmd.Title,
		cmd.Description,
		cmd.PingType,
		cmd.ScheduledAt,
		cmd.Invitees,
	)
	if err != nil {
		return nil, err
	}

	// Return result
	return &CreatePingResult{
		PingID:       ping.ID(),
		Title:        ping.Title(),
		PingType:     ping.PingType(),
		ScheduledAt:  ping.ScheduledAt(),
		InviteeCount: len(ping.Invitees()),
		CreatedAt:    ping.CreatedAt(),
	}, nil
}