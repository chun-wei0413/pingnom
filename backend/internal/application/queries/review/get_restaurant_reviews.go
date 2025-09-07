package review

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
)

// GetRestaurantReviewsQuery represents the query to get restaurant reviews
type GetRestaurantReviewsQuery struct {
	RestaurantID string
	UserID       shared.UserID // Optional filter for user-specific reviews
	Limit        int
	Offset       int
}

// GetRestaurantReviewsHandler handles the retrieval of restaurant reviews
type GetRestaurantReviewsHandler struct {
	repo review.RestaurantReviewRepository
}

// NewGetRestaurantReviewsHandler creates a new handler
func NewGetRestaurantReviewsHandler(repo review.RestaurantReviewRepository) *GetRestaurantReviewsHandler {
	return &GetRestaurantReviewsHandler{
		repo: repo,
	}
}

// Handle processes the get restaurant reviews query
func (h *GetRestaurantReviewsHandler) Handle(ctx context.Context, query GetRestaurantReviewsQuery) ([]*review.RestaurantReview, error) {
	// Set default values
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	// Get reviews by user and restaurant if user ID is specified
	var emptyUserID shared.UserID
	if query.UserID != emptyUserID {
		return h.repo.GetByUserAndRestaurant(ctx, query.UserID, query.RestaurantID, query.Limit, query.Offset)
	}

	// Get all reviews for the restaurant
	return h.repo.GetByRestaurantID(ctx, query.RestaurantID, query.Limit, query.Offset)
}