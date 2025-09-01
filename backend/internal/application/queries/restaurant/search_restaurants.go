package restaurant

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
)

// SearchRestaurantsQuery 搜尋餐廳查詢
type SearchRestaurantsQuery struct {
	// 位置條件
	CenterLocation *restaurant.Location `json:"centerLocation,omitempty"`
	RadiusKm       float64              `json:"radiusKm,omitempty"`

	// 篩選條件
	CuisineTypes        []restaurant.CuisineType        `json:"cuisineTypes,omitempty"`
	PriceRange          *restaurant.PriceRange          `json:"priceRange,omitempty"`
	DietaryRestrictions []restaurant.DietaryRestriction `json:"dietaryRestrictions,omitempty"`

	// 排序和分頁
	SortBy    restaurant.SortBy `json:"sortBy,omitempty"`
	SortOrder restaurant.Order  `json:"sortOrder,omitempty"`
	Limit     int               `json:"limit,omitempty"`
	Offset    int               `json:"offset,omitempty"`

	// 其他條件
	MinRating           float64 `json:"minRating,omitempty"`
	AcceptsReservations *bool   `json:"acceptsReservations,omitempty"`
}

// SearchRestaurantsHandler 搜尋餐廳處理器
type SearchRestaurantsHandler struct {
	repository restaurant.Repository
}

// NewSearchRestaurantsHandler 建立搜尋餐廳處理器
func NewSearchRestaurantsHandler(repository restaurant.Repository) *SearchRestaurantsHandler {
	return &SearchRestaurantsHandler{
		repository: repository,
	}
}

// Handle 處理搜尋餐廳查詢
func (h *SearchRestaurantsHandler) Handle(
	ctx context.Context,
	query SearchRestaurantsQuery,
) ([]*restaurant.Restaurant, error) {
	// 轉換為 domain 搜尋條件
	criteria := restaurant.SearchCriteria{
		CenterLocation:      query.CenterLocation,
		RadiusKm:            query.RadiusKm,
		CuisineTypes:        query.CuisineTypes,
		PriceRange:          query.PriceRange,
		DietaryRestrictions: query.DietaryRestrictions,
		SortBy:              query.SortBy,
		SortOrder:           query.SortOrder,
		Limit:               query.Limit,
		Offset:              query.Offset,
		MinRating:           query.MinRating,
		AcceptsReservations: query.AcceptsReservations,
		IsActive:            boolPtr(true),
	}

	return h.repository.Search(ctx, criteria)
}

// boolPtr 返回 bool 指標
func boolPtr(b bool) *bool {
	return &b
}