package inmemory

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
)

// InMemoryUserRepository implements the UserRepository interface using in-memory storage
// 實作 Infrastructure Layer 的 Repository，遵循 Clean Architecture
type InMemoryUserRepository struct {
	users map[string]*user.User // key: userID string
	mutex sync.RWMutex
}

// NewInMemoryUserRepository creates a new in-memory user repository
func NewInMemoryUserRepository() *InMemoryUserRepository {
	return &InMemoryUserRepository{
		users: make(map[string]*user.User),
		mutex: sync.RWMutex{},
	}
}

// Save stores a user in memory
func (r *InMemoryUserRepository) Save(ctx context.Context, u *user.User) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	r.users[u.ID.String()] = u
	return nil
}

// FindByID retrieves a user by ID
func (r *InMemoryUserRepository) FindByID(ctx context.Context, id shared.UserID) (*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	u, exists := r.users[id.String()]
	if !exists {
		return nil, shared.ErrUserNotFound
	}
	
	return u, nil
}

// FindByEmail retrieves a user by email
func (r *InMemoryUserRepository) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	
	for _, u := range r.users {
		if u.Email == normalizedEmail {
			return u, nil
		}
	}
	
	return nil, shared.ErrUserNotFound
}

// FindByPhoneNumber retrieves a user by phone number
func (r *InMemoryUserRepository) FindByPhoneNumber(ctx context.Context, phoneNumber string) (*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	normalizedPhone := strings.TrimSpace(phoneNumber)
	
	for _, u := range r.users {
		if u.PhoneNumber == normalizedPhone {
			return u, nil
		}
	}
	
	return nil, shared.ErrUserNotFound
}

// Update modifies an existing user
func (r *InMemoryUserRepository) Update(ctx context.Context, u *user.User) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.users[u.ID.String()]; !exists {
		return shared.ErrUserNotFound
	}
	
	u.UpdatedAt = time.Now()
	r.users[u.ID.String()] = u
	return nil
}

// Delete removes a user from memory
func (r *InMemoryUserRepository) Delete(ctx context.Context, id shared.UserID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.users[id.String()]; !exists {
		return shared.ErrUserNotFound
	}
	
	delete(r.users, id.String())
	return nil
}

// FindDiscoverableUsers retrieves users that can be discovered
func (r *InMemoryUserRepository) FindDiscoverableUsers(ctx context.Context, limit, offset int) ([]*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var discoverableUsers []*user.User
	count := 0
	
	for _, u := range r.users {
		if u.CanBeDiscovered() {
			if count >= offset {
				discoverableUsers = append(discoverableUsers, u)
				if len(discoverableUsers) >= limit {
					break
				}
			}
			count++
		}
	}
	
	return discoverableUsers, nil
}

// SearchUsers searches for users by query string
func (r *InMemoryUserRepository) SearchUsers(ctx context.Context, query string, limit, offset int) ([]*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var foundUsers []*user.User
	count := 0
	normalizedQuery := strings.ToLower(strings.TrimSpace(query))
	
	for _, u := range r.users {
		if r.matchesSearchQuery(u, normalizedQuery) {
			if count >= offset {
				foundUsers = append(foundUsers, u)
				if len(foundUsers) >= limit {
					break
				}
			}
			count++
		}
	}
	
	return foundUsers, nil
}

// CountUsers returns the total number of users
func (r *InMemoryUserRepository) CountUsers(ctx context.Context) (int64, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	return int64(len(r.users)), nil
}

// ExistsByEmail checks if a user with the given email exists
func (r *InMemoryUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	
	for _, u := range r.users {
		if u.Email == normalizedEmail {
			return true, nil
		}
	}
	
	return false, nil
}

// ExistsByPhoneNumber checks if a user with the given phone number exists
func (r *InMemoryUserRepository) ExistsByPhoneNumber(ctx context.Context, phoneNumber string) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	normalizedPhone := strings.TrimSpace(phoneNumber)
	
	for _, u := range r.users {
		if u.PhoneNumber == normalizedPhone {
			return true, nil
		}
	}
	
	return false, nil
}

// FindActiveUsers retrieves active users
func (r *InMemoryUserRepository) FindActiveUsers(ctx context.Context, limit, offset int) ([]*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var activeUsers []*user.User
	count := 0
	
	for _, u := range r.users {
		if u.IsActive {
			if count >= offset {
				activeUsers = append(activeUsers, u)
				if len(activeUsers) >= limit {
					break
				}
			}
			count++
		}
	}
	
	return activeUsers, nil
}

// FindUnverifiedUsers retrieves users that have not been verified for a certain time
func (r *InMemoryUserRepository) FindUnverifiedUsers(ctx context.Context, olderThan int) ([]*user.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var unverifiedUsers []*user.User
	cutoffTime := time.Now().AddDate(0, 0, -olderThan)
	
	for _, u := range r.users {
		if !u.IsVerified && u.CreatedAt.Before(cutoffTime) {
			unverifiedUsers = append(unverifiedUsers, u)
		}
	}
	
	return unverifiedUsers, nil
}

// Helper function to check if user matches search query
func (r *InMemoryUserRepository) matchesSearchQuery(u *user.User, query string) bool {
	// Search in display name, email, and bio
	displayName := strings.ToLower(u.Profile.DisplayName)
	email := strings.ToLower(u.Email)
	bio := strings.ToLower(u.Profile.Bio)
	
	return strings.Contains(displayName, query) || 
		   strings.Contains(email, query) || 
		   strings.Contains(bio, query)
}

// GetAll returns all users (for testing/debugging purposes)
func (r *InMemoryUserRepository) GetAll() []*user.User {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var allUsers []*user.User
	for _, u := range r.users {
		allUsers = append(allUsers, u)
	}
	
	return allUsers
}