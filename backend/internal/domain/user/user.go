package user

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID              shared.UserID      `json:"id"`
	Email           string             `json:"email"`
	PhoneNumber     string             `json:"phoneNumber,omitempty"`
	PasswordHash    string             `json:"-"`
	Profile         UserProfile        `json:"profile"`
	Preferences     DietaryPreferences `json:"preferences"`
	PrivacySettings PrivacySettings    `json:"privacySettings"`
	IsActive        bool               `json:"isActive"`
	IsVerified      bool               `json:"isVerified"`
	CreatedAt       time.Time          `json:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt"`
}

var (
	emailRegex = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)
	phoneRegex = regexp.MustCompile(`^\+?[1-9]\d{8,14}$`)
)

func NewUser(email, phoneNumber, password, displayName string) (*User, error) {
	userID := shared.NewUserID()
	
	// 驗證 Email
	if !isValidEmail(email) {
		return nil, shared.ErrInvalidEmail
	}
	
	// 驗證手機號碼 (可選)
	if phoneNumber != "" && !isValidPhoneNumber(phoneNumber) {
		return nil, shared.ErrInvalidPhone
	}
	
	// 驗證密碼強度
	if !isStrongPassword(password) {
		return nil, shared.ErrWeakPassword
	}
	
	// 驗證顯示名稱 (僅允許英文)
	if !isValidDisplayName(displayName) {
		return nil, shared.ErrInvalidDisplayName
	}
	
	// 建立密碼雜湊
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	
	// 建立基本檔案
	profile, err := NewUserProfile(displayName, "", "", nil)
	if err != nil {
		return nil, err
	}
	
	now := time.Now()
	
	return &User{
		ID:              userID,
		Email:           strings.ToLower(strings.TrimSpace(email)),
		PhoneNumber:     strings.TrimSpace(phoneNumber),
		PasswordHash:    string(passwordHash),
		Profile:         profile,
		Preferences:     DietaryPreferences{},
		PrivacySettings: DefaultPrivacySettings(),
		IsActive:        true,
		IsVerified:      false,
		CreatedAt:       now,
		UpdatedAt:       now,
	}, nil
}

func (u *User) UpdateProfile(profile UserProfile) error {
	if !profile.IsComplete() {
		return errors.New("profile is incomplete")
	}
	
	u.Profile = profile
	u.UpdatedAt = time.Now()
	return nil
}

func (u *User) UpdatePreferences(preferences DietaryPreferences) {
	u.Preferences = preferences
	u.UpdatedAt = time.Now()
}

func (u *User) UpdatePrivacySettings(settings PrivacySettings) {
	u.PrivacySettings = settings
	u.UpdatedAt = time.Now()
}

func (u *User) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func (u *User) ChangePassword(oldPassword, newPassword string) error {
	if !u.VerifyPassword(oldPassword) {
		return errors.New("invalid current password")
	}
	
	if !isStrongPassword(newPassword) {
		return shared.ErrWeakPassword
	}
	
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	
	u.PasswordHash = string(passwordHash)
	u.UpdatedAt = time.Now()
	return nil
}

func (u *User) Verify() {
	u.IsVerified = true
	u.UpdatedAt = time.Now()
}

func (u *User) Deactivate() {
	u.IsActive = false
	u.UpdatedAt = time.Now()
}

func (u *User) Activate() {
	u.IsActive = true
	u.UpdatedAt = time.Now()
}

func (u *User) CanBeDiscovered() bool {
	return u.IsActive && u.PrivacySettings.IsDiscoverable
}

func (u *User) AllowsFriendRequests() bool {
	return u.IsActive && u.PrivacySettings.AllowFriendRequest
}

func (u *User) SharesLocation() bool {
	return u.IsActive && u.PrivacySettings.ShowLocation
}

// Validation functions
func isValidEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	return emailRegex.MatchString(strings.ToLower(email))
}

func isValidPhoneNumber(phone string) bool {
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	return phoneRegex.MatchString(cleaned)
}

func isStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	
	hasUpper := strings.ContainsAny(password, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
	hasLower := strings.ContainsAny(password, "abcdefghijklmnopqrstuvwxyz")
	hasNumber := strings.ContainsAny(password, "0123456789")
	hasSpecial := strings.ContainsAny(password, "!@#$%^&*()_+-=[]{}|;:,.<>?")
	
	return hasUpper && hasLower && hasNumber && hasSpecial
}

func isValidDisplayName(displayName string) bool {
	if len(displayName) < 1 || len(displayName) > 50 {
		return false
	}
	
	// 只允許英文字母、數字、空格和常見標點符號
	for _, char := range displayName {
		if !((char >= 'a' && char <= 'z') || 
			 (char >= 'A' && char <= 'Z') || 
			 (char >= '0' && char <= '9') || 
			 char == ' ' || char == '.' || char == '-') {
			return false
		}
	}
	
	// 不能只有空格
	if strings.TrimSpace(displayName) == "" {
		return false
	}
	
	return true
}