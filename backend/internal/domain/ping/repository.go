package ping

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Repository defines the interface for ping persistence
type Repository interface {
	// Create stores a new ping
	Create(ctx context.Context, ping *Ping) error
	
	// GetByID retrieves a ping by ID
	GetByID(ctx context.Context, id shared.ID) (*Ping, error)
	
	// Update updates an existing ping
	Update(ctx context.Context, ping *Ping) error
	
	// Delete removes a ping
	Delete(ctx context.Context, id shared.ID) error
	
	// GetByCreator retrieves pings created by a specific user
	GetByCreator(ctx context.Context, creatorID shared.UserID, limit, offset int) ([]*Ping, error)
	
	// GetByInvitee retrieves pings where a user is invited
	GetByInvitee(ctx context.Context, inviteeID shared.UserID, limit, offset int) ([]*Ping, error)
	
	// GetActivePings retrieves all active pings for a user (created by or invited to)
	GetActivePings(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Ping, error)
	
	// GetPingsByStatus retrieves pings by status
	GetPingsByStatus(ctx context.Context, status PingStatus, limit, offset int) ([]*Ping, error)
}