package review

import (
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
)

// Rating represents a restaurant rating (1-5 stars)
type Rating int

const (
	RatingMinimum Rating = 1
	RatingMaximum Rating = 5
)

func (r Rating) IsValid() bool {
	return r >= RatingMinimum && r <= RatingMaximum
}

func (r Rating) Int() int {
	return int(r)
}

func (r Rating) Value() float64 {
	return float64(r)
}

func NewRating(value float64) (Rating, error) {
	rating := Rating(value)
	if !rating.IsValid() {
		return 0, shared.ErrInvalidRating
	}
	return rating, nil
}

// RestaurantReview represents a user's review of a restaurant
type RestaurantReview struct {
	id           ReviewID
	userID       shared.UserID
	restaurantID string
	activityID   activity.ActivityHistoryID
	rating       Rating
	comment      string
	foodQuality  Rating
	service      Rating
	atmosphere   Rating
	valueForMoney Rating
	reviewedAt   time.Time
	updatedAt    time.Time
}

// NewRestaurantReview creates a new restaurant review
func NewRestaurantReview(
	userID shared.UserID,
	restaurantID string,
	activityID activity.ActivityHistoryID,
	rating Rating,
	comment string,
) (*RestaurantReview, error) {
	if userID.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}
	
	if restaurantID == "" {
		return nil, shared.ErrInvalidInput
	}
	
	if activityID.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}
	
	if !rating.IsValid() {
		return nil, shared.ErrInvalidInput
	}

	now := time.Now()
	
	return &RestaurantReview{
		id:           NewReviewID(),
		userID:       userID,
		restaurantID: restaurantID,
		activityID:   activityID,
		rating:       rating,
		comment:      comment,
		foodQuality:  rating, // Default to overall rating
		service:      rating,
		atmosphere:   rating,
		valueForMoney: rating,
		reviewedAt:   now,
		updatedAt:    now,
	}, nil
}

// NewDetailedRestaurantReview creates a new restaurant review with detailed ratings
func NewDetailedRestaurantReview(
	userID shared.UserID,
	restaurantID string,
	activityID activity.ActivityHistoryID,
	overallRating float64,
	comment string,
	foodQuality, service, atmosphere, valueForMoney float64,
) (*RestaurantReview, error) {
	if userID.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}
	
	if restaurantID == "" {
		return nil, shared.ErrInvalidInput
	}
	
	if activityID.IsEmpty() {
		return nil, shared.ErrInvalidInput
	}

	// Convert float64 ratings to Rating type
	rating, err := NewRating(overallRating)
	if err != nil {
		return nil, err
	}
	
	foodRating, err := NewRating(foodQuality)
	if err != nil {
		return nil, err
	}
	
	serviceRating, err := NewRating(service)
	if err != nil {
		return nil, err
	}
	
	atmosphereRating, err := NewRating(atmosphere)
	if err != nil {
		return nil, err
	}
	
	valueRating, err := NewRating(valueForMoney)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	
	return &RestaurantReview{
		id:           NewReviewID(),
		userID:       userID,
		restaurantID: restaurantID,
		activityID:   activityID,
		rating:       rating,
		comment:      comment,
		foodQuality:  foodRating,
		service:      serviceRating,
		atmosphere:   atmosphereRating,
		valueForMoney: valueRating,
		reviewedAt:   now,
		updatedAt:    now,
	}, nil
}

// Getters
func (r *RestaurantReview) ID() ReviewID {
	return r.id
}

func (r *RestaurantReview) UserID() shared.UserID {
	return r.userID
}

func (r *RestaurantReview) RestaurantID() string {
	return r.restaurantID
}

func (r *RestaurantReview) ActivityID() activity.ActivityHistoryID {
	return r.activityID
}

func (r *RestaurantReview) Rating() Rating {
	return r.rating
}

func (r *RestaurantReview) Comment() string {
	return r.comment
}

func (r *RestaurantReview) FoodQuality() Rating {
	return r.foodQuality
}

func (r *RestaurantReview) Service() Rating {
	return r.service
}

func (r *RestaurantReview) Atmosphere() Rating {
	return r.atmosphere
}

func (r *RestaurantReview) ValueForMoney() Rating {
	return r.valueForMoney
}

func (r *RestaurantReview) ReviewedAt() time.Time {
	return r.reviewedAt
}

func (r *RestaurantReview) UpdatedAt() time.Time {
	return r.updatedAt
}

// Business Methods
func (r *RestaurantReview) UpdateReview(rating Rating, comment string) error {
	if !rating.IsValid() {
		return shared.ErrInvalidInput
	}
	
	r.rating = rating
	r.comment = comment
	r.updatedAt = time.Now()
	
	return nil
}

func (r *RestaurantReview) UpdateDetailedRatings(
	foodQuality, service, atmosphere, valueForMoney Rating,
) error {
	if !foodQuality.IsValid() || !service.IsValid() || 
	   !atmosphere.IsValid() || !valueForMoney.IsValid() {
		return shared.ErrInvalidInput
	}
	
	r.foodQuality = foodQuality
	r.service = service
	r.atmosphere = atmosphere
	r.valueForMoney = valueForMoney
	r.updatedAt = time.Now()
	
	// Update overall rating as average of detailed ratings
	avgRating := (foodQuality + service + atmosphere + valueForMoney) / 4
	r.rating = avgRating
	
	return nil
}

func (r *RestaurantReview) GetAverageRating() float64 {
	return float64(r.foodQuality + r.service + r.atmosphere + r.valueForMoney) / 4.0
}

func (r *RestaurantReview) UpdateRating(rating float64) error {
	newRating, err := NewRating(rating)
	if err != nil {
		return err
	}
	r.rating = newRating
	r.updatedAt = time.Now()
	return nil
}

func (r *RestaurantReview) UpdateComment(comment string) {
	r.comment = comment
	r.updatedAt = time.Now()
}