package inmemory

import (
	"context"
	"sync"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// RestaurantReviewInMemoryRepository implements the restaurant review repository using in-memory storage
type RestaurantReviewInMemoryRepository struct {
	reviews map[string]*review.RestaurantReview
	mutex   sync.RWMutex
}

// NewRestaurantReviewInMemoryRepository creates a new in-memory restaurant review repository
func NewRestaurantReviewInMemoryRepository() *RestaurantReviewInMemoryRepository {
	return &RestaurantReviewInMemoryRepository{
		reviews: make(map[string]*review.RestaurantReview),
	}
}

// Save stores a restaurant review
func (r *RestaurantReviewInMemoryRepository) Save(ctx context.Context, review *review.RestaurantReview) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	r.reviews[review.ID().String()] = review
	return nil
}

// GetByID retrieves a review by its ID
func (r *RestaurantReviewInMemoryRepository) GetByID(ctx context.Context, id review.ReviewID) (*review.RestaurantReview, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	if rev, exists := r.reviews[id.String()]; exists {
		return rev, nil
	}
	return nil, shared.ErrReviewNotFound
}

// GetByUserID retrieves all reviews by a user
func (r *RestaurantReviewInMemoryRepository) GetByUserID(ctx context.Context, userID shared.UserID, limit, offset int) ([]*review.RestaurantReview, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var userReviews []*review.RestaurantReview
	for _, rev := range r.reviews {
		if rev.UserID() == userID {
			userReviews = append(userReviews, rev)
		}
	}
	
	// Sort by review date (newest first)
	for i := 0; i < len(userReviews)-1; i++ {
		for j := i + 1; j < len(userReviews); j++ {
			if userReviews[i].ReviewedAt().Before(userReviews[j].ReviewedAt()) {
				userReviews[i], userReviews[j] = userReviews[j], userReviews[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(userReviews) {
		return []*review.RestaurantReview{}, nil
	}
	
	end := offset + limit
	if end > len(userReviews) {
		end = len(userReviews)
	}
	
	return userReviews[offset:end], nil
}

// GetByRestaurantID retrieves all reviews for a restaurant
func (r *RestaurantReviewInMemoryRepository) GetByRestaurantID(ctx context.Context, restaurantID string, limit, offset int) ([]*review.RestaurantReview, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var restaurantReviews []*review.RestaurantReview
	for _, rev := range r.reviews {
		if rev.RestaurantID() == restaurantID {
			restaurantReviews = append(restaurantReviews, rev)
		}
	}
	
	// Sort by review date (newest first)
	for i := 0; i < len(restaurantReviews)-1; i++ {
		for j := i + 1; j < len(restaurantReviews); j++ {
			if restaurantReviews[i].ReviewedAt().Before(restaurantReviews[j].ReviewedAt()) {
				restaurantReviews[i], restaurantReviews[j] = restaurantReviews[j], restaurantReviews[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(restaurantReviews) {
		return []*review.RestaurantReview{}, nil
	}
	
	end := offset + limit
	if end > len(restaurantReviews) {
		end = len(restaurantReviews)
	}
	
	return restaurantReviews[offset:end], nil
}

// GetByActivityID retrieves review for a specific activity
func (r *RestaurantReviewInMemoryRepository) GetByActivityID(ctx context.Context, activityID activity.ActivityHistoryID) (*review.RestaurantReview, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	for _, rev := range r.reviews {
		if rev.ActivityID() == activityID {
			return rev, nil
		}
	}
	return nil, shared.ErrReviewNotFound
}

// GetByUserAndRestaurant retrieves reviews by a user for a specific restaurant
func (r *RestaurantReviewInMemoryRepository) GetByUserAndRestaurant(ctx context.Context, userID shared.UserID, restaurantID string, limit, offset int) ([]*review.RestaurantReview, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var userRestaurantReviews []*review.RestaurantReview
	for _, rev := range r.reviews {
		if rev.UserID() == userID && rev.RestaurantID() == restaurantID {
			userRestaurantReviews = append(userRestaurantReviews, rev)
		}
	}
	
	// Sort by review date (newest first)
	for i := 0; i < len(userRestaurantReviews)-1; i++ {
		for j := i + 1; j < len(userRestaurantReviews); j++ {
			if userRestaurantReviews[i].ReviewedAt().Before(userRestaurantReviews[j].ReviewedAt()) {
				userRestaurantReviews[i], userRestaurantReviews[j] = userRestaurantReviews[j], userRestaurantReviews[i]
			}
		}
	}
	
	// Apply pagination
	if offset >= len(userRestaurantReviews) {
		return []*review.RestaurantReview{}, nil
	}
	
	end := offset + limit
	if end > len(userRestaurantReviews) {
		end = len(userRestaurantReviews)
	}
	
	return userRestaurantReviews[offset:end], nil
}

// Update updates an existing review
func (r *RestaurantReviewInMemoryRepository) Update(ctx context.Context, review *review.RestaurantReview) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.reviews[review.ID().String()]; !exists {
		return shared.ErrReviewNotFound
	}
	
	r.reviews[review.ID().String()] = review
	return nil
}

// Delete removes a review
func (r *RestaurantReviewInMemoryRepository) Delete(ctx context.Context, id review.ReviewID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.reviews[id.String()]; !exists {
		return shared.ErrReviewNotFound
	}
	
	delete(r.reviews, id.String())
	return nil
}

// GetAverageRatingForRestaurant calculates average rating for a restaurant
func (r *RestaurantReviewInMemoryRepository) GetAverageRatingForRestaurant(ctx context.Context, restaurantID string) (float64, int, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var totalRating float64
	var count int
	
	for _, rev := range r.reviews {
		if rev.RestaurantID() == restaurantID {
			totalRating += rev.Rating().Value()
			count++
		}
	}
	
	if count == 0 {
		return 0.0, 0, nil
	}
	
	return totalRating / float64(count), count, nil
}

// GetUserReviewCount returns total review count for a user
func (r *RestaurantReviewInMemoryRepository) GetUserReviewCount(ctx context.Context, userID shared.UserID) (int, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	count := 0
	for _, rev := range r.reviews {
		if rev.UserID() == userID {
			count++
		}
	}
	
	return count, nil
}

// GetUserAverageRating calculates user's average rating across all reviews
func (r *RestaurantReviewInMemoryRepository) GetUserAverageRating(ctx context.Context, userID shared.UserID) (float64, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var totalRating float64
	var count int
	
	for _, rev := range r.reviews {
		if rev.UserID() == userID {
			totalRating += rev.Rating().Value()
			count++
		}
	}
	
	if count == 0 {
		return 0.0, nil
	}
	
	return totalRating / float64(count), nil
}

// Exists checks if a review already exists for a user and activity
func (r *RestaurantReviewInMemoryRepository) Exists(ctx context.Context, userID shared.UserID, activityID activity.ActivityHistoryID) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	for _, rev := range r.reviews {
		if rev.UserID() == userID && rev.ActivityID() == activityID {
			return true, nil
		}
	}
	
	return false, nil
}