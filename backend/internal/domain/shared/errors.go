package shared

import "errors"

var (
	// Domain Errors
	ErrEntityNotFound     = errors.New("entity not found")
	ErrInvalidInput       = errors.New("invalid input")
	ErrUnauthorized      = errors.New("unauthorized access")
	ErrPermissionDenied  = errors.New("permission denied")
	ErrResourceConflict  = errors.New("resource conflict")
	ErrInvalidID         = errors.New("invalid ID format")
	
	// User Domain Errors
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrInvalidPhone       = errors.New("invalid phone number")
	ErrWeakPassword       = errors.New("password too weak")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrInvalidDisplayName = errors.New("display name must contain only English letters, numbers, and spaces")
	
	// Ping Domain Errors
	ErrPingNotFound      = errors.New("ping not found")
	ErrPingExpired       = errors.New("ping has expired")
	ErrPingCancelled     = errors.New("ping has been cancelled")
	ErrInvalidPingTime   = errors.New("ping time must be in the future")
	ErrAlreadyResponded  = errors.New("already responded to this ping")
	
	// Social Domain Errors
	ErrFriendshipNotFound    = errors.New("friendship not found")
	ErrFriendshipExists      = errors.New("friendship already exists")
	ErrSelfFriendRequest     = errors.New("cannot send friend request to yourself")
	ErrGroupNotFound         = errors.New("group not found")
	ErrNotGroupMember        = errors.New("not a group member")
	ErrNotGroupCreator       = errors.New("not the group creator")
	
	// Restaurant Domain Errors
	ErrRestaurantNotFound = errors.New("restaurant not found")
	ErrInvalidLocation    = errors.New("invalid location coordinates")
	
	// Activity Domain Errors
	ErrActivityHistoryNotFound = errors.New("activity history not found")
	ErrInvalidActivityStatus   = errors.New("invalid activity status")
	ErrInvalidParticipants     = errors.New("participants must be greater than 0")
	
	// Review Domain Errors
	ErrReviewNotFound          = errors.New("review not found")
	ErrReviewAlreadyExists     = errors.New("review already exists for this activity")
	ErrInvalidRating          = errors.New("rating must be between 1 and 5")
	
	// Bill Domain Errors
	ErrBillNotFound           = errors.New("bill not found")
	ErrBillItemNotFound       = errors.New("bill item not found")
	ErrParticipantNotFound    = errors.New("participant not found")
	ErrInvalidBillStatus      = errors.New("invalid bill status")
	ErrBillAlreadyCompleted   = errors.New("bill is already completed")
	ErrCannotModifyCompletedBill = errors.New("cannot modify completed bill")
)

type DomainError struct {
	Code    string
	Message string
	Cause   error
}

func (e DomainError) Error() string {
	if e.Cause != nil {
		return e.Message + ": " + e.Cause.Error()
	}
	return e.Message
}

func (e DomainError) Unwrap() error {
	return e.Cause
}

func NewDomainError(code, message string, cause error) DomainError {
	return DomainError{
		Code:    code,
		Message: message,
		Cause:   cause,
	}
}