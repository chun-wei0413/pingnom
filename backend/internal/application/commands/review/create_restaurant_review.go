package review

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// CreateRestaurantReviewCommand represents the command to create a restaurant review
type CreateRestaurantReviewCommand struct {
	UserID         shared.UserID
	RestaurantID   string
	ActivityID     activity.ActivityHistoryID
	Rating         float64
	Comment        string
	FoodQuality    float64
	Service        float64
	Atmosphere     float64
	ValueForMoney  float64
}

// CreateRestaurantReviewHandler handles the creation of restaurant reviews
type CreateRestaurantReviewHandler struct {
	repo review.RestaurantReviewRepository
}

// NewCreateRestaurantReviewHandler creates a new handler
func NewCreateRestaurantReviewHandler(repo review.RestaurantReviewRepository) *CreateRestaurantReviewHandler {
	return &CreateRestaurantReviewHandler{
		repo: repo,
	}
}

// Handle processes the create restaurant review command
func (h *CreateRestaurantReviewHandler) Handle(ctx context.Context, cmd CreateRestaurantReviewCommand) (*review.RestaurantReview, error) {
	// Check if review already exists for this user and activity
	exists, err := h.repo.Exists(ctx, cmd.UserID, cmd.ActivityID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, shared.ErrReviewAlreadyExists
	}

	// Create new restaurant review
	restaurantReview, err := review.NewDetailedRestaurantReview(
		cmd.UserID,
		cmd.RestaurantID,
		cmd.ActivityID,
		cmd.Rating,
		cmd.Comment,
		cmd.FoodQuality,
		cmd.Service,
		cmd.Atmosphere,
		cmd.ValueForMoney,
	)
	if err != nil {
		return nil, err
	}

	// Save to repository
	if err := h.repo.Save(ctx, restaurantReview); err != nil {
		return nil, err
	}

	return restaurantReview, nil
}