package user

import (
	"context"
	"errors"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// UserService contains domain business logic that doesn't belong to a single aggregate
// 這是 Domain Service，處理跨 Aggregate 或複雜的業務邏輯
type UserService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// RegisterUser handles the complete user registration process
func (s *UserService) RegisterUser(ctx context.Context, email, phoneNumber, password, displayName string) (*User, error) {
	// 檢查 Email 是否已存在
	exists, err := s.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, shared.ErrUserAlreadyExists
	}
	
	// 檢查手機號碼是否已存在 (如果提供)
	if phoneNumber != "" {
		exists, err := s.userRepo.ExistsByPhoneNumber(ctx, phoneNumber)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, shared.ErrUserAlreadyExists
		}
	}
	
	// 建立新使用者
	user, err := NewUser(email, phoneNumber, password, displayName)
	if err != nil {
		return nil, err
	}
	
	// 儲存使用者
	if err := s.userRepo.Save(ctx, user); err != nil {
		return nil, err
	}
	
	return user, nil
}

// GetUserByEmail retrieves user by email
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.userRepo.FindByEmail(ctx, email)
}

// AuthenticateUser verifies user credentials and returns the user if valid
func (s *UserService) AuthenticateUser(ctx context.Context, email, password string) (*User, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, shared.ErrUserNotFound
	}
	
	if !user.IsActive {
		return nil, errors.New("user account is deactivated")
	}
	
	if !user.VerifyPassword(password) {
		return nil, errors.New("invalid password")
	}
	
	return user, nil
}

// UpdateUserProfile updates user profile with validation
func (s *UserService) UpdateUserProfile(ctx context.Context, userID shared.UserID, profile UserProfile) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	if err := user.UpdateProfile(profile); err != nil {
		return err
	}
	
	return s.userRepo.Update(ctx, user)
}

// UpdateUserPreferences updates user dietary preferences
func (s *UserService) UpdateUserPreferences(ctx context.Context, userID shared.UserID, preferences DietaryPreferences) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	user.UpdatePreferences(preferences)
	return s.userRepo.Update(ctx, user)
}

// UpdatePrivacySettings updates user privacy settings
func (s *UserService) UpdatePrivacySettings(ctx context.Context, userID shared.UserID, settings PrivacySettings) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	user.UpdatePrivacySettings(settings)
	return s.userRepo.Update(ctx, user)
}

// VerifyUser marks a user as verified
func (s *UserService) VerifyUser(ctx context.Context, userID shared.UserID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	user.Verify()
	return s.userRepo.Update(ctx, user)
}

// ChangePassword changes user password with verification
func (s *UserService) ChangePassword(ctx context.Context, userID shared.UserID, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	if err := user.ChangePassword(oldPassword, newPassword); err != nil {
		return err
	}
	
	return s.userRepo.Update(ctx, user)
}

// SearchDiscoverableUsers returns users that can be discovered by others
func (s *UserService) SearchDiscoverableUsers(ctx context.Context, query string, limit, offset int) ([]*User, error) {
	if query == "" {
		return s.userRepo.FindDiscoverableUsers(ctx, limit, offset)
	}
	return s.userRepo.SearchUsers(ctx, query, limit, offset)
}

// DeactivateUser deactivates a user account
func (s *UserService) DeactivateUser(ctx context.Context, userID shared.UserID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return shared.ErrUserNotFound
	}
	
	user.Deactivate()
	return s.userRepo.Update(ctx, user)
}