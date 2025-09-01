package restaurant

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
)

// GetRestaurantRecommendationsQuery 獲取餐廳推薦查詢
type GetRestaurantRecommendationsQuery struct {
	ParticipantLocations []restaurant.Location           `json:"participantLocations"`
	CuisinePreferences   []restaurant.CuisineType        `json:"cuisinePreferences,omitempty"`
	PriceRange           *restaurant.PriceRange          `json:"priceRange,omitempty"`
	DietaryRestrictions  []restaurant.DietaryRestriction `json:"dietaryRestrictions,omitempty"`
	MaxDistance          float64                         `json:"maxDistance,omitempty"` // 公里
	MaxResults           int                             `json:"maxResults,omitempty"`
}

// GetRestaurantRecommendationsHandler 獲取餐廳推薦處理器
type GetRestaurantRecommendationsHandler struct {
	recommendationService *restaurant.RecommendationService
}

// NewGetRestaurantRecommendationsHandler 建立獲取餐廳推薦處理器
func NewGetRestaurantRecommendationsHandler(
	recommendationService *restaurant.RecommendationService,
) *GetRestaurantRecommendationsHandler {
	return &GetRestaurantRecommendationsHandler{
		recommendationService: recommendationService,
	}
}

// Handle 處理獲取餐廳推薦查詢
func (h *GetRestaurantRecommendationsHandler) Handle(
	ctx context.Context,
	query GetRestaurantRecommendationsQuery,
) ([]*restaurant.RecommendationResult, error) {
	// 轉換為 domain 請求
	req := restaurant.RecommendationRequest{
		ParticipantLocations: query.ParticipantLocations,
		CuisinePreferences:   query.CuisinePreferences,
		PriceRange:           query.PriceRange,
		DietaryRestrictions:  query.DietaryRestrictions,
		MaxDistance:          query.MaxDistance,
		MaxResults:           query.MaxResults,
	}

	// 呼叫 domain service
	return h.recommendationService.GetRecommendations(ctx, req)
}