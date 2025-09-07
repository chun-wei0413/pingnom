package statistics

import (
	"context"
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/activity"
	"github.com/chun-wei0413/pingnom/internal/domain/review"
)

// StatisticsService provides domain logic for user statistics
type StatisticsService struct {
	activityRepo activity.ActivityHistoryRepository
	reviewRepo   review.RestaurantReviewRepository
}

// NewStatisticsService creates a new statistics service
func NewStatisticsService(
	activityRepo activity.ActivityHistoryRepository,
	reviewRepo review.RestaurantReviewRepository,
) *StatisticsService {
	return &StatisticsService{
		activityRepo: activityRepo,
		reviewRepo:   reviewRepo,
	}
}

// GenerateUserStatistics creates comprehensive statistics for a user
func (s *StatisticsService) GenerateUserStatistics(ctx context.Context, userID shared.UserID) (*UserStatistics, error) {
	stats := NewUserStatistics(userID)
	
	// Get activity statistics
	if err := s.calculateActivityStats(ctx, stats); err != nil {
		return nil, err
	}
	
	// Get review statistics
	if err := s.calculateReviewStats(ctx, stats); err != nil {
		return nil, err
	}
	
	// Get favorite restaurants
	if err := s.calculateFavoriteRestaurants(ctx, stats); err != nil {
		return nil, err
	}
	
	// Get monthly statistics
	if err := s.calculateMonthlyStats(ctx, stats); err != nil {
		return nil, err
	}
	
	return stats, nil
}

func (s *StatisticsService) calculateActivityStats(ctx context.Context, stats *UserStatistics) error {
	userID := stats.UserID()
	
	// Get total activities
	total, err := s.activityRepo.GetUserActivityCount(ctx, userID)
	if err != nil {
		return err
	}
	
	// Get completed activities
	completed, err := s.activityRepo.GetUserActivityCountByStatus(ctx, userID, activity.ActivityStatusCompleted)
	if err != nil {
		return err
	}
	
	// Get cancelled activities
	cancelled, err := s.activityRepo.GetUserActivityCountByStatus(ctx, userID, activity.ActivityStatusCancelled)
	if err != nil {
		return err
	}
	
	// Get first and last activity dates
	activities, err := s.activityRepo.GetByUserID(ctx, userID, 1, 0)
	if err != nil {
		return err
	}
	
	var firstActivity, lastActivity time.Time
	if len(activities) > 0 {
		// Get first activity (oldest)
		allActivities, err := s.activityRepo.GetByUserID(ctx, userID, total, 0)
		if err != nil {
			return err
		}
		
		if len(allActivities) > 0 {
			firstActivity = allActivities[len(allActivities)-1].AttendedAt()
			lastActivity = allActivities[0].AttendedAt()
		}
	}
	
	stats.UpdateActivityStats(total, completed, cancelled, firstActivity, lastActivity)
	return nil
}

func (s *StatisticsService) calculateReviewStats(ctx context.Context, stats *UserStatistics) error {
	userID := stats.UserID()
	
	// Get total reviews
	totalReviews, err := s.reviewRepo.GetUserReviewCount(ctx, userID)
	if err != nil {
		return err
	}
	
	// Get average rating
	averageRating, err := s.reviewRepo.GetUserAverageRating(ctx, userID)
	if err != nil {
		return err
	}
	
	stats.UpdateReviewStats(totalReviews, averageRating)
	return nil
}

func (s *StatisticsService) calculateFavoriteRestaurants(ctx context.Context, stats *UserStatistics) error {
	userID := stats.UserID()
	
	// Get all user activities
	activities, err := s.activityRepo.GetByUserIDAndStatus(ctx, userID, activity.ActivityStatusCompleted, 100, 0)
	if err != nil {
		return err
	}
	
	// Count visits per restaurant
	restaurantVisits := make(map[string]*RestaurantStats)
	
	for _, act := range activities {
		if existing, found := restaurantVisits[act.RestaurantID()]; found {
			existing.VisitCount++
			if act.AttendedAt().After(existing.LastVisited) {
				existing.LastVisited = act.AttendedAt()
			}
		} else {
			restaurantVisits[act.RestaurantID()] = &RestaurantStats{
				RestaurantID:   act.RestaurantID(),
				RestaurantName: act.RestaurantName(),
				VisitCount:     1,
				LastVisited:    act.AttendedAt(),
			}
		}
	}
	
	// Calculate average ratings for each restaurant
	for restaurantID, restaurantStat := range restaurantVisits {
		avgRating, _, err := s.reviewRepo.GetAverageRatingForRestaurant(ctx, restaurantID)
		if err != nil {
			avgRating = 0.0 // Default if no reviews
		}
		restaurantStat.AverageRating = avgRating
	}
	
	// Convert to slice and sort by visit count
	var favoriteRestaurants []RestaurantStats
	for _, stat := range restaurantVisits {
		favoriteRestaurants = append(favoriteRestaurants, *stat)
	}
	
	// Simple bubble sort by visit count (descending)
	for i := 0; i < len(favoriteRestaurants)-1; i++ {
		for j := 0; j < len(favoriteRestaurants)-i-1; j++ {
			if favoriteRestaurants[j].VisitCount < favoriteRestaurants[j+1].VisitCount {
				favoriteRestaurants[j], favoriteRestaurants[j+1] = favoriteRestaurants[j+1], favoriteRestaurants[j]
			}
		}
	}
	
	// Limit to top 10
	if len(favoriteRestaurants) > 10 {
		favoriteRestaurants = favoriteRestaurants[:10]
	}
	
	stats.SetFavoriteRestaurants(favoriteRestaurants)
	return nil
}

func (s *StatisticsService) calculateMonthlyStats(ctx context.Context, stats *UserStatistics) error {
	userID := stats.UserID()
	
	// Get all activities for the user
	activities, err := s.activityRepo.GetByUserID(ctx, userID, 1000, 0) // Get up to 1000 activities
	if err != nil {
		return err
	}
	
	// Group by month
	monthlyMap := make(map[string]*MonthlyStats)
	
	for _, act := range activities {
		monthKey := act.AttendedAt().Format("2006-01")
		year := act.AttendedAt().Year()
		month := int(act.AttendedAt().Month())
		
		if existing, found := monthlyMap[monthKey]; found {
			existing.Activities++
		} else {
			monthlyMap[monthKey] = &MonthlyStats{
				Year:       year,
				Month:      month,
				Activities: 1,
				Reviews:    0,
			}
		}
	}
	
	// Get reviews for each month
	reviews, err := s.reviewRepo.GetByUserID(ctx, userID, 1000, 0)
	if err != nil {
		return err
	}
	
	for _, rev := range reviews {
		monthKey := rev.ReviewedAt().Format("2006-01")
		if existing, found := monthlyMap[monthKey]; found {
			existing.Reviews++
		}
	}
	
	// Convert to slice
	var monthlyStats []MonthlyStats
	for _, stat := range monthlyMap {
		monthlyStats = append(monthlyStats, *stat)
	}
	
	stats.SetMonthlyStats(monthlyStats)
	return nil
}