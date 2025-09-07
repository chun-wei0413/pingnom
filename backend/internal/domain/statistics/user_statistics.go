package statistics

import (
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// RestaurantStats represents statistics for a specific restaurant
type RestaurantStats struct {
	RestaurantID   string
	RestaurantName string
	VisitCount     int
	AverageRating  float64
	LastVisited    time.Time
}

// MonthlyStats represents activity statistics for a specific month
type MonthlyStats struct {
	Year       int
	Month      int
	Activities int
	Reviews    int
}

// UserStatistics represents comprehensive user activity statistics
type UserStatistics struct {
	userID                shared.UserID
	totalActivities       int
	completedActivities   int
	cancelledActivities   int
	totalReviews          int
	averageRating         float64
	favoriteRestaurants   []RestaurantStats
	monthlyStats          []MonthlyStats
	mostActiveMonth       time.Time
	firstActivityDate     time.Time
	lastActivityDate      time.Time
	generatedAt           time.Time
}

// NewUserStatistics creates a new user statistics value object
func NewUserStatistics(userID shared.UserID) *UserStatistics {
	return &UserStatistics{
		userID:              userID,
		totalActivities:     0,
		completedActivities: 0,
		cancelledActivities: 0,
		totalReviews:        0,
		averageRating:       0.0,
		favoriteRestaurants: make([]RestaurantStats, 0),
		monthlyStats:        make([]MonthlyStats, 0),
		generatedAt:         time.Now(),
	}
}

// Getters
func (s *UserStatistics) UserID() shared.UserID {
	return s.userID
}

func (s *UserStatistics) TotalActivities() int {
	return s.totalActivities
}

func (s *UserStatistics) CompletedActivities() int {
	return s.completedActivities
}

func (s *UserStatistics) CancelledActivities() int {
	return s.cancelledActivities
}

func (s *UserStatistics) TotalReviews() int {
	return s.totalReviews
}

func (s *UserStatistics) AverageRating() float64 {
	return s.averageRating
}

func (s *UserStatistics) FavoriteRestaurants() []RestaurantStats {
	return s.favoriteRestaurants
}

func (s *UserStatistics) MonthlyStats() []MonthlyStats {
	return s.monthlyStats
}

func (s *UserStatistics) MostActiveMonth() time.Time {
	return s.mostActiveMonth
}

func (s *UserStatistics) FirstActivityDate() time.Time {
	return s.firstActivityDate
}

func (s *UserStatistics) LastActivityDate() time.Time {
	return s.lastActivityDate
}

func (s *UserStatistics) GeneratedAt() time.Time {
	return s.generatedAt
}

// Business Methods
func (s *UserStatistics) UpdateActivityStats(
	total, completed, cancelled int,
	firstActivity, lastActivity time.Time,
) {
	s.totalActivities = total
	s.completedActivities = completed
	s.cancelledActivities = cancelled
	s.firstActivityDate = firstActivity
	s.lastActivityDate = lastActivity
	s.generatedAt = time.Now()
}

func (s *UserStatistics) UpdateReviewStats(totalReviews int, averageRating float64) {
	s.totalReviews = totalReviews
	s.averageRating = averageRating
	s.generatedAt = time.Now()
}

func (s *UserStatistics) SetFavoriteRestaurants(restaurants []RestaurantStats) {
	s.favoriteRestaurants = restaurants
	s.generatedAt = time.Now()
}

func (s *UserStatistics) SetMonthlyStats(monthlyStats []MonthlyStats) {
	s.monthlyStats = monthlyStats
	s.generatedAt = time.Now()
	
	// Find most active month
	maxActivities := 0
	for _, stat := range monthlyStats {
		if stat.Activities > maxActivities {
			maxActivities = stat.Activities
			s.mostActiveMonth = time.Date(stat.Year, time.Month(stat.Month), 1, 0, 0, 0, 0, time.UTC)
		}
	}
}

// Calculated Properties
func (s *UserStatistics) GetCompletionRate() float64 {
	if s.totalActivities == 0 {
		return 0.0
	}
	return float64(s.completedActivities) / float64(s.totalActivities) * 100.0
}

func (s *UserStatistics) GetCancellationRate() float64 {
	if s.totalActivities == 0 {
		return 0.0
	}
	return float64(s.cancelledActivities) / float64(s.totalActivities) * 100.0
}

func (s *UserStatistics) GetReviewRate() float64 {
	if s.completedActivities == 0 {
		return 0.0
	}
	return float64(s.totalReviews) / float64(s.completedActivities) * 100.0
}

func (s *UserStatistics) GetTopRestaurant() *RestaurantStats {
	if len(s.favoriteRestaurants) == 0 {
		return nil
	}
	return &s.favoriteRestaurants[0]
}