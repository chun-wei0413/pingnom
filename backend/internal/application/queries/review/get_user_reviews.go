package review

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
)

// GetUserReviewsQuery represents the query to get user's reviews
type GetUserReviewsQuery struct {
	UserID shared.UserID
	Limit  int
	Offset int
}

// GetUserReviewsHandler handles the retrieval of user reviews
type GetUserReviewsHandler struct {
	repo review.RestaurantReviewRepository
}

// NewGetUserReviewsHandler creates a new handler
func NewGetUserReviewsHandler(repo review.RestaurantReviewRepository) *GetUserReviewsHandler {
	return &GetUserReviewsHandler{
		repo: repo,
	}
}

// Handle processes the get user reviews query
func (h *GetUserReviewsHandler) Handle(ctx context.Context, query GetUserReviewsQuery) ([]*review.RestaurantReview, error) {
	// Set default values
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	return h.repo.GetByUserID(ctx, query.UserID, query.Limit, query.Offset)
}