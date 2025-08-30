package persistence

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/user"
	"gorm.io/gorm"
)

// UserModel represents the database model for User
type UserModel struct {
	ID              string                 `gorm:"type:uuid;primary_key" json:"id"`
	Email           string                 `gorm:"uniqueIndex;not null" json:"email"`
	PhoneNumber     string                 `gorm:"index" json:"phone_number"`
	PasswordHash    string                 `gorm:"not null" json:"-"`
	Profile         ProfileJSON            `gorm:"type:jsonb" json:"profile"`
	Preferences     PreferencesJSON        `gorm:"type:jsonb" json:"preferences"`
	PrivacySettings PrivacySettingsJSON    `gorm:"type:jsonb" json:"privacy_settings"`
	IsActive        bool                   `gorm:"default:true" json:"is_active"`
	IsVerified      bool                   `gorm:"default:false" json:"is_verified"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

func (UserModel) TableName() string {
	return "users"
}

// JSON wrapper types for GORM
type ProfileJSON user.UserProfile
type PreferencesJSON user.DietaryPreferences
type PrivacySettingsJSON user.PrivacySettings

func (p ProfileJSON) Value() (driver.Value, error) {
	return json.Marshal(p)
}

func (p *ProfileJSON) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, p)
}

func (p PreferencesJSON) Value() (driver.Value, error) {
	return json.Marshal(p)
}

func (p *PreferencesJSON) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, p)
}

func (p PrivacySettingsJSON) Value() (driver.Value, error) {
	return json.Marshal(p)
}

func (p *PrivacySettingsJSON) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, p)
}

// PostgreSQLUserRepository implements the UserRepository interface
type PostgreSQLUserRepository struct {
	db *gorm.DB
}

func NewPostgreSQLUserRepository(db *gorm.DB) *PostgreSQLUserRepository {
	return &PostgreSQLUserRepository{
		db: db,
	}
}

func (r *PostgreSQLUserRepository) Save(ctx context.Context, user *user.User) error {
	model := r.domainToModel(user)
	result := r.db.WithContext(ctx).Create(model)
	return result.Error
}

func (r *PostgreSQLUserRepository) FindByID(ctx context.Context, id shared.UserID) (*user.User, error) {
	var model UserModel
	result := r.db.WithContext(ctx).Where("id = ?", id.String()).First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared.ErrUserNotFound
		}
		return nil, result.Error
	}
	return r.modelToDomain(&model)
}

func (r *PostgreSQLUserRepository) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	var model UserModel
	result := r.db.WithContext(ctx).Where("email = ?", strings.ToLower(email)).First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared.ErrUserNotFound
		}
		return nil, result.Error
	}
	return r.modelToDomain(&model)
}

func (r *PostgreSQLUserRepository) FindByPhoneNumber(ctx context.Context, phoneNumber string) (*user.User, error) {
	var model UserModel
	result := r.db.WithContext(ctx).Where("phone_number = ?", phoneNumber).First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared.ErrUserNotFound
		}
		return nil, result.Error
	}
	return r.modelToDomain(&model)
}

func (r *PostgreSQLUserRepository) Update(ctx context.Context, user *user.User) error {
	model := r.domainToModel(user)
	result := r.db.WithContext(ctx).Save(model)
	return result.Error
}

func (r *PostgreSQLUserRepository) Delete(ctx context.Context, id shared.UserID) error {
	result := r.db.WithContext(ctx).Delete(&UserModel{}, "id = ?", id.String())
	return result.Error
}

func (r *PostgreSQLUserRepository) FindDiscoverableUsers(ctx context.Context, limit, offset int) ([]*user.User, error) {
	var models []UserModel
	result := r.db.WithContext(ctx).
		Where("is_active = ? AND privacy_settings->>'isDiscoverable' = 'true'", true).
		Limit(limit).
		Offset(offset).
		Find(&models)
	
	if result.Error != nil {
		return nil, result.Error
	}
	
	users := make([]*user.User, len(models))
	for i, model := range models {
		domainUser, err := r.modelToDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = domainUser
	}
	
	return users, nil
}

func (r *PostgreSQLUserRepository) SearchUsers(ctx context.Context, query string, limit, offset int) ([]*user.User, error) {
	var models []UserModel
	searchPattern := fmt.Sprintf("%%%s%%", strings.ToLower(query))
	
	result := r.db.WithContext(ctx).
		Where("is_active = ? AND privacy_settings->>'isDiscoverable' = 'true'", true).
		Where("LOWER(email) LIKE ? OR LOWER(profile->>'displayName') LIKE ?", searchPattern, searchPattern).
		Limit(limit).
		Offset(offset).
		Find(&models)
	
	if result.Error != nil {
		return nil, result.Error
	}
	
	users := make([]*user.User, len(models))
	for i, model := range models {
		domainUser, err := r.modelToDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = domainUser
	}
	
	return users, nil
}

func (r *PostgreSQLUserRepository) CountUsers(ctx context.Context) (int64, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&UserModel{}).Count(&count)
	return count, result.Error
}

func (r *PostgreSQLUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&UserModel{}).Where("email = ?", strings.ToLower(email)).Count(&count)
	return count > 0, result.Error
}

func (r *PostgreSQLUserRepository) ExistsByPhoneNumber(ctx context.Context, phoneNumber string) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&UserModel{}).Where("phone_number = ?", phoneNumber).Count(&count)
	return count > 0, result.Error
}

func (r *PostgreSQLUserRepository) FindActiveUsers(ctx context.Context, limit, offset int) ([]*user.User, error) {
	var models []UserModel
	result := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Limit(limit).
		Offset(offset).
		Find(&models)
	
	if result.Error != nil {
		return nil, result.Error
	}
	
	users := make([]*user.User, len(models))
	for i, model := range models {
		domainUser, err := r.modelToDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = domainUser
	}
	
	return users, nil
}

func (r *PostgreSQLUserRepository) FindUnverifiedUsers(ctx context.Context, olderThan int) ([]*user.User, error) {
	var models []UserModel
	cutoff := time.Now().AddDate(0, 0, -olderThan)
	
	result := r.db.WithContext(ctx).
		Where("is_verified = ? AND created_at < ?", false, cutoff).
		Find(&models)
	
	if result.Error != nil {
		return nil, result.Error
	}
	
	users := make([]*user.User, len(models))
	for i, model := range models {
		domainUser, err := r.modelToDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = domainUser
	}
	
	return users, nil
}

// Helper methods for conversion
func (r *PostgreSQLUserRepository) domainToModel(u *user.User) *UserModel {
	return &UserModel{
		ID:              u.ID.String(),
		Email:           u.Email,
		PhoneNumber:     u.PhoneNumber,
		PasswordHash:    u.PasswordHash,
		Profile:         ProfileJSON(u.Profile),
		Preferences:     PreferencesJSON(u.Preferences),
		PrivacySettings: PrivacySettingsJSON(u.PrivacySettings),
		IsActive:        u.IsActive,
		IsVerified:      u.IsVerified,
		CreatedAt:       u.CreatedAt,
		UpdatedAt:       u.UpdatedAt,
	}
}

func (r *PostgreSQLUserRepository) modelToDomain(m *UserModel) (*user.User, error) {
	userID, err := shared.NewUserIDFromString(m.ID)
	if err != nil {
		return nil, err
	}
	
	return &user.User{
		ID:              userID,
		Email:           m.Email,
		PhoneNumber:     m.PhoneNumber,
		PasswordHash:    m.PasswordHash,
		Profile:         user.UserProfile(m.Profile),
		Preferences:     user.DietaryPreferences(m.Preferences),
		PrivacySettings: user.PrivacySettings(m.PrivacySettings),
		IsActive:        m.IsActive,
		IsVerified:      m.IsVerified,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}, nil
}