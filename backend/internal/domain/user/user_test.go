package user

import (
	"testing"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

func TestNewUser(t *testing.T) {
	tests := []struct {
		name        string
		email       string
		phoneNumber string
		password    string
		displayName string
		wantErr     bool
		expectedErr error
	}{
		{
			name:        "valid user creation",
			email:       "test@example.com",
			phoneNumber: "+886912345678",
			password:    "Test123!@#",
			displayName: "Test User",
			wantErr:     false,
		},
		{
			name:        "invalid email",
			email:       "invalid-email",
			phoneNumber: "",
			password:    "Test123!@#",
			displayName: "Test User",
			wantErr:     true,
			expectedErr: shared.ErrInvalidEmail,
		},
		{
			name:        "weak password",
			email:       "test@example.com",
			phoneNumber: "",
			password:    "weak",
			displayName: "Test User",
			wantErr:     true,
			expectedErr: shared.ErrWeakPassword,
		},
		{
			name:        "invalid phone number",
			email:       "test@example.com",
			phoneNumber: "invalid-phone",
			password:    "Test123!@#",
			displayName: "Test User",
			wantErr:     true,
			expectedErr: shared.ErrInvalidPhone,
		},
		{
			name:        "empty display name",
			email:       "test@example.com",
			phoneNumber: "",
			password:    "Test123!@#",
			displayName: "",
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := NewUser(tt.email, tt.phoneNumber, tt.password, tt.displayName)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("NewUser() expected error, got nil")
					return
				}
				if tt.expectedErr != nil && err != tt.expectedErr {
					t.Errorf("NewUser() expected error %v, got %v", tt.expectedErr, err)
				}
				return
			}
			
			if err != nil {
				t.Errorf("NewUser() unexpected error: %v", err)
				return
			}
			
			if user == nil {
				t.Error("NewUser() returned nil user")
				return
			}
			
			// 驗證使用者屬性
			if user.Email != tt.email {
				t.Errorf("NewUser() email = %v, want %v", user.Email, tt.email)
			}
			
			if user.PhoneNumber != tt.phoneNumber {
				t.Errorf("NewUser() phoneNumber = %v, want %v", user.PhoneNumber, tt.phoneNumber)
			}
			
			if user.Profile.DisplayName != tt.displayName {
				t.Errorf("NewUser() displayName = %v, want %v", user.Profile.DisplayName, tt.displayName)
			}
			
			if !user.IsActive {
				t.Error("NewUser() user should be active by default")
			}
			
			if user.IsVerified {
				t.Error("NewUser() user should not be verified by default")
			}
			
			// 驗證密碼
			if !user.VerifyPassword(tt.password) {
				t.Error("NewUser() password verification failed")
			}
		})
	}
}

func TestUser_VerifyPassword(t *testing.T) {
	user, err := NewUser("test@example.com", "", "Test123!@#", "Test User")
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{
			name:     "correct password",
			password: "Test123!@#",
			want:     true,
		},
		{
			name:     "wrong password",
			password: "WrongPassword",
			want:     false,
		},
		{
			name:     "empty password",
			password: "",
			want:     false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := user.VerifyPassword(tt.password); got != tt.want {
				t.Errorf("User.VerifyPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestUser_ChangePassword(t *testing.T) {
	
	tests := []struct {
		name        string
		oldPassword string
		newPassword string
		wantErr     bool
	}{
		{
			name:        "valid password change",
			oldPassword: "Test123!@#",
			newPassword: "NewPass123!@#",
			wantErr:     false,
		},
		{
			name:        "wrong old password",
			oldPassword: "WrongPassword",
			newPassword: "NewPass123!@#",
			wantErr:     true,
		},
		{
			name:        "weak new password",
			oldPassword: "Test123!@#",
			newPassword: "weak",
			wantErr:     true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 重新建立使用者以確保初始狀態
			testUser, _ := NewUser("test@example.com", "", "Test123!@#", "Test User")
			
			err := testUser.ChangePassword(tt.oldPassword, tt.newPassword)
			
			if tt.wantErr {
				if err == nil {
					t.Error("ChangePassword() expected error, got nil")
				}
				return
			}
			
			if err != nil {
				t.Errorf("ChangePassword() unexpected error: %v", err)
				return
			}
			
			// 驗證新密碼有效，舊密碼無效
			if !testUser.VerifyPassword(tt.newPassword) {
				t.Error("ChangePassword() new password should be valid")
			}
			
			if testUser.VerifyPassword(tt.oldPassword) {
				t.Error("ChangePassword() old password should be invalid")
			}
		})
	}
}