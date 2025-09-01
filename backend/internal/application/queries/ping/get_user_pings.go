package ping

import (
	"context"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// GetUserPingsQuery represents the query to get user's pings
type GetUserPingsQuery struct {
	UserID shared.UserID `json:"userId" validate:"required"`
	Limit  int           `json:"limit" validate:"min=1,max=100"`
	Offset int           `json:"offset" validate:"min=0"`
}

// PingResponseDTO represents a ping response for API
type PingResponseDTO struct {
	UserID      shared.UserID        `json:"userId"`
	Status      ping.ResponseStatus  `json:"status"`
	Message     string               `json:"message"`
	RespondedAt *time.Time           `json:"respondedAt,omitempty"`
}

// PingDTO represents a ping for API responses
type PingDTO struct {
	ID           shared.ID         `json:"id"`
	CreatedBy    shared.UserID     `json:"createdBy"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	PingType     ping.PingType     `json:"pingType"`
	Status       ping.PingStatus   `json:"status"`
	ScheduledAt  time.Time         `json:"scheduledAt"`
	Location     *shared.Location  `json:"location,omitempty"`
	Responses    []PingResponseDTO `json:"responses"`
	InviteeCount int               `json:"inviteeCount"`
	AcceptedCount int              `json:"acceptedCount"`
	PendingCount int               `json:"pendingCount"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

// GetUserPingsResult represents the result of getting user's pings
type GetUserPingsResult struct {
	Pings []PingDTO `json:"pings"`
	Total int       `json:"total"`
}

// GetUserPingsHandler handles queries for user's pings
type GetUserPingsHandler struct {
	pingService *ping.Service
}

// NewGetUserPingsHandler creates a new get user pings handler
func NewGetUserPingsHandler(pingService *ping.Service) *GetUserPingsHandler {
	return &GetUserPingsHandler{
		pingService: pingService,
	}
}

// Handle processes the get user pings query
func (h *GetUserPingsHandler) Handle(ctx context.Context, query GetUserPingsQuery) (*GetUserPingsResult, error) {
	// Set default values
	if query.Limit == 0 {
		query.Limit = 20
	}

	// Get pings from service
	pings, err := h.pingService.GetUserPings(ctx, query.UserID, query.Limit, query.Offset)
	if err != nil {
		return nil, err
	}

	// Convert to DTOs
	pingDTOs := make([]PingDTO, len(pings))
	for i, p := range pings {
		// Convert responses
		responses := make([]PingResponseDTO, len(p.Responses()))
		for j, response := range p.Responses() {
			responses[j] = PingResponseDTO{
				UserID:      response.UserID,
				Status:      response.Status,
				Message:     response.Message,
				RespondedAt: response.RespondedAt,
			}
		}

		pingDTOs[i] = PingDTO{
			ID:            p.ID(),
			CreatedBy:     p.CreatedBy(),
			Title:         p.Title(),
			Description:   p.Description(),
			PingType:      p.PingType(),
			Status:        p.Status(),
			ScheduledAt:   p.ScheduledAt(),
			Location:      p.Location(),
			Responses:     responses,
			InviteeCount:  len(p.Invitees()),
			AcceptedCount: p.GetAcceptedCount(),
			PendingCount:  p.GetPendingCount(),
			CreatedAt:     p.CreatedAt(),
			UpdatedAt:     p.UpdatedAt(),
		}
	}

	return &GetUserPingsResult{
		Pings: pingDTOs,
		Total: len(pingDTOs),
	}, nil
}