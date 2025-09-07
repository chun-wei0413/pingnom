package review

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// RestaurantReviewRepository defines the interface for restaurant review persistence
type RestaurantReviewRepository interface {
	// Save stores a restaurant review
	Save(ctx context.Context, review *RestaurantReview) error
	
	// GetByID retrieves a review by its ID
	GetByID(ctx context.Context, id ReviewID) (*RestaurantReview, error)
	
	// GetByUserID retrieves all reviews by a user
	GetByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*RestaurantReview, error)
	
	// GetByRestaurantID retrieves all reviews for a restaurant
	GetByRestaurantID(ctx context.Context, restaurantID string, limit, offset int) ([]*RestaurantReview, error)
	
	// GetByActivityID retrieves review for a specific activity
	GetByActivityID(ctx context.Context, activityID activity.ActivityHistoryID) (*RestaurantReview, error)
	
	// GetByUserAndRestaurant retrieves reviews by a user for a specific restaurant
	GetByUserAndRestaurant(ctx context.Context, userID shared.UserID, restaurantID string, limit, offset int) ([]*RestaurantReview, error)
	
	// Update updates an existing review
	Update(ctx context.Context, review *RestaurantReview) error
	
	// Delete removes a review
	Delete(ctx context.Context, id ReviewID) error
	
	// GetAverageRatingForRestaurant calculates average rating for a restaurant
	GetAverageRatingForRestaurant(ctx context.Context, restaurantID string) (float64, int, error)
	
	// GetUserReviewCount returns total review count for a user
	GetUserReviewCount(ctx context.Context, userID shared.UserID) (int, error)
	
	// GetUserAverageRating calculates user's average rating across all reviews
	GetUserAverageRating(ctx context.Context, userID shared.UserID) (float64, error)
	
	// Exists checks if a review already exists for a user and activity
	Exists(ctx context.Context, userID shared.UserID, activityID activity.ActivityHistoryID) (bool, error)
}