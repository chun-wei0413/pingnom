package inmemory

import (
	"context"
	"sort"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/ping"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// PingRepository implements ping.Repository using in-memory storage
type PingRepository struct {
	pings map[string]*ping.Ping
	mu    sync.RWMutex
}

// NewPingRepository creates a new in-memory ping repository
func NewPingRepository() *PingRepository {
	return &PingRepository{
		pings: make(map[string]*ping.Ping),
	}
}

// Create stores a new ping
func (r *PingRepository) Create(ctx context.Context, p *ping.Ping) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.pings[p.ID().String()] = p
	return nil
}

// GetByID retrieves a ping by ID
func (r *PingRepository) GetByID(ctx context.Context, id shared.ID) (*ping.Ping, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	p, exists := r.pings[id.String()]
	if !exists {
		return nil, shared.ErrPingNotFound
	}
	
	return p, nil
}

// Update updates an existing ping
func (r *PingRepository) Update(ctx context.Context, p *ping.Ping) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	_, exists := r.pings[p.ID().String()]
	if !exists {
		return shared.ErrPingNotFound
	}
	
	r.pings[p.ID().String()] = p
	return nil
}

// Delete removes a ping
func (r *PingRepository) Delete(ctx context.Context, id shared.ID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	_, exists := r.pings[id.String()]
	if !exists {
		return shared.ErrPingNotFound
	}
	
	delete(r.pings, id.String())
	return nil
}

// GetByCreator retrieves pings created by a specific user
func (r *PingRepository) GetByCreator(ctx context.Context, creatorID shared.UserID, limit, offset int) ([]*ping.Ping, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var result []*ping.Ping
	for _, p := range r.pings {
		if p.CreatedBy() == creatorID {
			result = append(result, p)
		}
	}
	
	// Sort by creation time (newest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt().After(result[j].CreatedAt())
	})
	
	return paginateSlice(result, limit, offset), nil
}

// GetByInvitee retrieves pings where a user is invited
func (r *PingRepository) GetByInvitee(ctx context.Context, inviteeID shared.UserID, limit, offset int) ([]*ping.Ping, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var result []*ping.Ping
	for _, p := range r.pings {
		for _, invitee := range p.Invitees() {
			if invitee == inviteeID {
				result = append(result, p)
				break
			}
		}
	}
	
	// Sort by creation time (newest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt().After(result[j].CreatedAt())
	})
	
	return paginateSlice(result, limit, offset), nil
}

// GetActivePings retrieves all active pings for a user (created by or invited to)
func (r *PingRepository) GetActivePings(ctx context.Context, userID shared.UserID, limit, offset int) ([]*ping.Ping, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var result []*ping.Ping
	for _, p := range r.pings {
		// Include if user is creator or invitee and ping is active
		if p.Status() == ping.PingStatusActive {
			if p.CreatedBy() == userID {
				result = append(result, p)
				continue
			}
			
			// Check if user is invitee
			for _, invitee := range p.Invitees() {
				if invitee == userID {
					result = append(result, p)
					break
				}
			}
		}
	}
	
	// Sort by scheduled time (earliest first for active pings)
	sort.Slice(result, func(i, j int) bool {
		return result[i].ScheduledAt().Before(result[j].ScheduledAt())
	})
	
	return paginateSlice(result, limit, offset), nil
}

// GetPingsByStatus retrieves pings by status
func (r *PingRepository) GetPingsByStatus(ctx context.Context, status ping.PingStatus, limit, offset int) ([]*ping.Ping, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var result []*ping.Ping
	for _, p := range r.pings {
		if p.Status() == status {
			result = append(result, p)
		}
	}
	
	// Sort by creation time (newest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt().After(result[j].CreatedAt())
	})
	
	return paginateSlice(result, limit, offset), nil
}

// Helper function to paginate slice
func paginateSlice[T any](slice []T, limit, offset int) []T {
	if offset >= len(slice) {
		return []T{}
	}
	
	end := offset + limit
	if end > len(slice) {
		end = len(slice)
	}
	
	return slice[offset:end]
}