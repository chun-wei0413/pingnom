package ping

import (
	"context"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Service provides business logic for ping operations
type Service struct {
	repo Repository
}

// NewService creates a new ping service
func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

// CreatePing creates a new ping invitation
func (s *Service) CreatePing(ctx context.Context, createdBy shared.UserID, title, description string, pingType PingType, scheduledAt time.Time, invitees []shared.UserID) (*Ping, error) {
	ping, err := NewPing(createdBy, title, description, pingType, scheduledAt, invitees)
	if err != nil {
		return nil, err
	}
	
	err = s.repo.Create(ctx, ping)
	if err != nil {
		return nil, err
	}
	
	return ping, nil
}

// RespondToPing allows a user to respond to a ping invitation
func (s *Service) RespondToPing(ctx context.Context, pingID shared.ID, userID shared.UserID, status ResponseStatus, message string) (*Ping, error) {
	ping, err := s.repo.GetByID(ctx, pingID)
	if err != nil {
		return nil, err
	}
	
	err = ping.RespondToPing(userID, status, message)
	if err != nil {
		return nil, err
	}
	
	err = s.repo.Update(ctx, ping)
	if err != nil {
		return nil, err
	}
	
	return ping, nil
}

// CancelPing cancels a ping (only by creator)
func (s *Service) CancelPing(ctx context.Context, pingID shared.ID, userID shared.UserID) (*Ping, error) {
	ping, err := s.repo.GetByID(ctx, pingID)
	if err != nil {
		return nil, err
	}
	
	// Only creator can cancel
	if ping.CreatedBy() != userID {
		return nil, shared.ErrPermissionDenied
	}
	
	err = ping.Cancel()
	if err != nil {
		return nil, err
	}
	
	err = s.repo.Update(ctx, ping)
	if err != nil {
		return nil, err
	}
	
	return ping, nil
}

// CompletePing marks a ping as completed
func (s *Service) CompletePing(ctx context.Context, pingID shared.ID, userID shared.UserID) (*Ping, error) {
	ping, err := s.repo.GetByID(ctx, pingID)
	if err != nil {
		return nil, err
	}
	
	// Only creator can complete
	if ping.CreatedBy() != userID {
		return nil, shared.ErrPermissionDenied
	}
	
	err = ping.Complete()
	if err != nil {
		return nil, err
	}
	
	err = s.repo.Update(ctx, ping)
	if err != nil {
		return nil, err
	}
	
	return ping, nil
}

// SetPingLocation updates the location for a ping
func (s *Service) SetPingLocation(ctx context.Context, pingID shared.ID, userID shared.UserID, location *shared.Location) (*Ping, error) {
	ping, err := s.repo.GetByID(ctx, pingID)
	if err != nil {
		return nil, err
	}
	
	// Only creator can set location
	if ping.CreatedBy() != userID {
		return nil, shared.ErrPermissionDenied
	}
	
	ping.SetLocation(location)
	
	err = s.repo.Update(ctx, ping)
	if err != nil {
		return nil, err
	}
	
	return ping, nil
}

// GetUserPings retrieves pings for a user (created or invited to)
func (s *Service) GetUserPings(ctx context.Context, userID shared.UserID, limit, offset int) ([]*Ping, error) {
	return s.repo.GetActivePings(ctx, userID, limit, offset)
}

// GetPingByID retrieves a specific ping
func (s *Service) GetPingByID(ctx context.Context, pingID shared.ID) (*Ping, error) {
	return s.repo.GetByID(ctx, pingID)
}

// ExpirePings marks expired pings as expired
func (s *Service) ExpirePings(ctx context.Context) error {
	// Get all active pings
	activePings, err := s.repo.GetPingsByStatus(ctx, PingStatusActive, 1000, 0)
	if err != nil {
		return err
	}
	
	// Check and expire outdated pings
	for _, ping := range activePings {
		if ping.IsExpired() {
			ping.status = PingStatusExpired
			ping.updatedAt = time.Now()
			err := s.repo.Update(ctx, ping)
			if err != nil {
				// Log error but continue processing other pings
				continue
			}
		}
	}
	
	return nil
}