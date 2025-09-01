package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	restaurantQueries "github.com/chun-wei0413/pingnom/internal/application/queries/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// RestaurantHandler 餐廳 HTTP 處理器
type RestaurantHandler struct {
	searchHandler         *restaurantQueries.SearchRestaurantsHandler
	recommendationHandler *restaurantQueries.GetRestaurantRecommendationsHandler
}

// NewRestaurantHandler 建立新的餐廳處理器
func NewRestaurantHandler(
	searchHandler *restaurantQueries.SearchRestaurantsHandler,
	recommendationHandler *restaurantQueries.GetRestaurantRecommendationsHandler,
) *RestaurantHandler {
	return &RestaurantHandler{
		searchHandler:         searchHandler,
		recommendationHandler: recommendationHandler,
	}
}

// SearchRestaurants 搜尋餐廳
func (h *RestaurantHandler) SearchRestaurants(c *gin.Context) {
	var query restaurantQueries.SearchRestaurantsQuery

	// 解析查詢參數
	if latStr := c.Query("lat"); latStr != "" {
		if lat, err := strconv.ParseFloat(latStr, 64); err == nil {
			if lonStr := c.Query("lon"); lonStr != "" {
				if lon, err := strconv.ParseFloat(lonStr, 64); err == nil {
					query.CenterLocation = &restaurant.Location{
						Latitude:  lat,
						Longitude: lon,
					}
				}
			}
		}
	}

	if radiusStr := c.Query("radius"); radiusStr != "" {
		if radius, err := strconv.ParseFloat(radiusStr, 64); err == nil {
			query.RadiusKm = radius
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			query.Limit = limit
		}
	} else {
		query.Limit = 20 // 預設限制
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			query.Offset = offset
		}
	}

	if minRatingStr := c.Query("minRating"); minRatingStr != "" {
		if minRating, err := strconv.ParseFloat(minRatingStr, 64); err == nil {
			query.MinRating = minRating
		}
	}

	// 解析料理類型
	if cuisineTypesStr := c.Query("cuisineTypes"); cuisineTypesStr != "" {
		// 簡化處理，假設用逗號分隔
		// 實際應該解析 JSON 或使用更複雜的參數處理
		query.CuisineTypes = []restaurant.CuisineType{restaurant.CuisineType(cuisineTypesStr)}
	}

	// 排序
	if sortBy := c.Query("sortBy"); sortBy != "" {
		query.SortBy = restaurant.SortBy(sortBy)
	} else {
		query.SortBy = restaurant.SortByDistance
	}

	if sortOrder := c.Query("sortOrder"); sortOrder != "" {
		query.SortOrder = restaurant.Order(sortOrder)
	} else {
		query.SortOrder = restaurant.OrderAsc
	}

	restaurants, err := h.searchHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"restaurants": restaurants})
}

// GetRecommendations 獲取餐廳推薦
func (h *RestaurantHandler) GetRecommendations(c *gin.Context) {
	var req struct {
		ParticipantLocations []restaurant.Location           `json:"participantLocations"`
		CuisinePreferences   []restaurant.CuisineType        `json:"cuisinePreferences,omitempty"`
		PriceRange           *restaurant.PriceRange          `json:"priceRange,omitempty"`
		DietaryRestrictions  []restaurant.DietaryRestriction `json:"dietaryRestrictions,omitempty"`
		MaxDistance          float64                         `json:"maxDistance,omitempty"`
		MaxResults           int                             `json:"maxResults,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 驗證必要參數
	if len(req.ParticipantLocations) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one participant location is required"})
		return
	}

	// 驗證位置資訊
	for _, location := range req.ParticipantLocations {
		if location.Latitude < -90 || location.Latitude > 90 ||
			location.Longitude < -180 || location.Longitude > 180 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location coordinates"})
			return
		}
	}

	query := restaurantQueries.GetRestaurantRecommendationsQuery{
		ParticipantLocations: req.ParticipantLocations,
		CuisinePreferences:   req.CuisinePreferences,
		PriceRange:           req.PriceRange,
		DietaryRestrictions:  req.DietaryRestrictions,
		MaxDistance:          req.MaxDistance,
		MaxResults:           req.MaxResults,
	}

	recommendations, err := h.recommendationHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recommendations": recommendations})
}

// GetRestaurantByID 根據 ID 獲取餐廳詳情
func (h *RestaurantHandler) GetRestaurantByID(c *gin.Context) {
	restaurantID := c.Param("id")
	if restaurantID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Restaurant ID is required"})
		return
	}

	// 轉換為 RestaurantID
	id, err := shared.NewRestaurantIDFromString(restaurantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid restaurant ID"})
		return
	}

	// 這裡應該有一個 GetRestaurantByIDHandler
	// 為了簡化，我們直接使用 repository（實際應該通過 application layer）
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented yet", "restaurantId": id.String()})
}