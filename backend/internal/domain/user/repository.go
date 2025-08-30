package user

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// UserRepository defines the interface for user data access
// 遵循 DDD Repository Pattern，只定義介面，實作在 Infrastructure Layer
type UserRepository interface {
	// Basic CRUD operations
	Save(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id shared.UserID) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByPhoneNumber(ctx context.Context, phoneNumber string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id shared.UserID) error
	
	// Query operations
	FindDiscoverableUsers(ctx context.Context, limit, offset int) ([]*User, error)
	SearchUsers(ctx context.Context, query string, limit, offset int) ([]*User, error)
	CountUsers(ctx context.Context) (int64, error)
	
	// Business-specific queries
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	ExistsByPhoneNumber(ctx context.Context, phoneNumber string) (bool, error)
	FindActiveUsers(ctx context.Context, limit, offset int) ([]*User, error)
	FindUnverifiedUsers(ctx context.Context, olderThan int) ([]*User, error)
}