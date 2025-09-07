package review

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
)

// UpdateRestaurantReviewCommand represents the command to update a restaurant review
type UpdateRestaurantReviewCommand struct {
	ID             review.ReviewID
	UserID         shared.UserID
	Rating         float64
	Comment        string
	FoodQuality    float64
	Service        float64
	Atmosphere     float64
	ValueForMoney  float64
}

// UpdateRestaurantReviewHandler handles the updating of restaurant reviews
type UpdateRestaurantReviewHandler struct {
	repo review.RestaurantReviewRepository
}

// NewUpdateRestaurantReviewHandler creates a new handler
func NewUpdateRestaurantReviewHandler(repo review.RestaurantReviewRepository) *UpdateRestaurantReviewHandler {
	return &UpdateRestaurantReviewHandler{
		repo: repo,
	}
}

// Handle processes the update restaurant review command
func (h *UpdateRestaurantReviewHandler) Handle(ctx context.Context, cmd UpdateRestaurantReviewCommand) (*review.RestaurantReview, error) {
	// Get existing review
	existing, err := h.repo.GetByID(ctx, cmd.ID)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if existing.UserID() != cmd.UserID {
		return nil, shared.ErrUnauthorized
	}

	// Update review details
	if err := existing.UpdateRating(cmd.Rating); err != nil {
		return nil, err
	}

	existing.UpdateComment(cmd.Comment)

	// Convert float64 to Rating and update detailed ratings
	foodRating, err := review.NewRating(cmd.FoodQuality)
	if err != nil {
		return nil, err
	}
	serviceRating, err := review.NewRating(cmd.Service)
	if err != nil {
		return nil, err
	}
	atmosphereRating, err := review.NewRating(cmd.Atmosphere)
	if err != nil {
		return nil, err
	}
	valueRating, err := review.NewRating(cmd.ValueForMoney)
	if err != nil {
		return nil, err
	}

	if err := existing.UpdateDetailedRatings(
		foodRating,
		serviceRating,
		atmosphereRating,
		valueRating,
	); err != nil {
		return nil, err
	}

	// Save changes
	if err := h.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}