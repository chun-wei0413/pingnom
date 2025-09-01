package restaurant

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Repository 餐廳儲存庫介面
type Repository interface {
	// Create 建立新餐廳
	Create(ctx context.Context, restaurant *Restaurant) error
	
	// FindByID 根據 ID 尋找餐廳
	FindByID(ctx context.Context, id shared.RestaurantID) (*Restaurant, error)
	
	// FindByLocation 根據位置範圍尋找餐廳
	FindByLocation(ctx context.Context, centerLat, centerLon, radiusKm float64) ([]*Restaurant, error)
	
	// FindNearby 尋找附近的餐廳
	FindNearby(ctx context.Context, location Location, radiusKm float64, criteria SearchCriteria) ([]*Restaurant, error)
	
	// Update 更新餐廳資訊
	Update(ctx context.Context, restaurant *Restaurant) error
	
	// Delete 刪除餐廳
	Delete(ctx context.Context, id shared.RestaurantID) error
	
	// FindAll 獲取所有餐廳 (分頁)
	FindAll(ctx context.Context, limit, offset int) ([]*Restaurant, error)
	
	// Search 根據條件搜尋餐廳
	Search(ctx context.Context, criteria SearchCriteria) ([]*Restaurant, error)
}

// SearchCriteria 搜尋條件
type SearchCriteria struct {
	// 位置條件
	CenterLocation *Location `json:"centerLocation,omitempty"`
	RadiusKm       float64   `json:"radiusKm,omitempty"`
	
	// 篩選條件
	CuisineTypes      []CuisineType        `json:"cuisineTypes,omitempty"`
	PriceRange        *PriceRange         `json:"priceRange,omitempty"`
	DietaryRestrictions []DietaryRestriction `json:"dietaryRestrictions,omitempty"`
	
	// 排序和分頁
	SortBy    SortBy `json:"sortBy,omitempty"`
	SortOrder Order  `json:"sortOrder,omitempty"`
	Limit     int    `json:"limit,omitempty"`
	Offset    int    `json:"offset,omitempty"`
	
	// 其他條件
	MinRating           float64 `json:"minRating,omitempty"`
	AcceptsReservations *bool   `json:"acceptsReservations,omitempty"`
	IsActive            *bool   `json:"isActive,omitempty"`
}

// PriceRange 價位範圍
type PriceRange struct {
	MinPrice int `json:"minPrice"`
	MaxPrice int `json:"maxPrice"`
}

// SortBy 排序欄位
type SortBy string

const (
	SortByDistance SortBy = "distance"
	SortByRating   SortBy = "rating"
	SortByPrice    SortBy = "price"
	SortByName     SortBy = "name"
)

// Order 排序順序
type Order string

const (
	OrderAsc  Order = "asc"
	OrderDesc Order = "desc"
)