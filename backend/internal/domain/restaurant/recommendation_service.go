package restaurant

import (
	"context"
	"sort"
)

// RecommendationService 餐廳推薦服務
type RecommendationService struct {
	repository Repository
}

// NewRecommendationService 建立餐廳推薦服務
func NewRecommendationService(repository Repository) *RecommendationService {
	return &RecommendationService{
		repository: repository,
	}
}

// RecommendationRequest 推薦請求
type RecommendationRequest struct {
	ParticipantLocations []Location           `json:"participantLocations"`
	CuisinePreferences   []CuisineType        `json:"cuisinePreferences,omitempty"`
	PriceRange           *PriceRange          `json:"priceRange,omitempty"`
	DietaryRestrictions  []DietaryRestriction `json:"dietaryRestrictions,omitempty"`
	MaxDistance          float64              `json:"maxDistance,omitempty"` // 公里
	MaxResults           int                  `json:"maxResults,omitempty"`
}

// RecommendationResult 推薦結果
type RecommendationResult struct {
	Restaurant         *Restaurant `json:"restaurant"`
	Score              float64     `json:"score"`              // 推薦分數 (0-100)
	DistanceFromCenter float64     `json:"distanceFromCenter"` // 距離中心點的距離 (公里)
	AverageDistance    float64     `json:"averageDistance"`    // 平均距離 (公里)
	MaxDistance        float64     `json:"maxDistance"`        // 最遠距離 (公里)
}

// GetRecommendations 獲取餐廳推薦
func (s *RecommendationService) GetRecommendations(ctx context.Context, req RecommendationRequest) ([]*RecommendationResult, error) {
	// 設定預設值
	if req.MaxDistance == 0 {
		req.MaxDistance = 10.0 // 預設 10 公里
	}
	if req.MaxResults == 0 {
		req.MaxResults = 10 // 預設 10 個結果
	}

	// 1. 計算最佳會面地點（所有參與者位置的中心點）
	centerLocation := calculateOptimalMeetingPoint(req.ParticipantLocations)

	// 2. 搜尋附近的餐廳
	criteria := SearchCriteria{
		CenterLocation:      &centerLocation,
		RadiusKm:            req.MaxDistance,
		CuisineTypes:        req.CuisinePreferences,
		PriceRange:          req.PriceRange,
		DietaryRestrictions: req.DietaryRestrictions,
		SortBy:              SortByDistance,
		SortOrder:           OrderAsc,
		Limit:               req.MaxResults * 2, // 取更多結果以便計算分數後篩選
		IsActive:            boolPtr(true),
	}

	restaurants, err := s.repository.Search(ctx, criteria)
	if err != nil {
		return nil, err
	}

	// 3. 計算每個餐廳的推薦分數
	results := make([]*RecommendationResult, 0, len(restaurants))
	for _, restaurant := range restaurants {
		result := s.calculateRecommendationScore(restaurant, req, centerLocation)
		results = append(results, result)
	}

	// 4. 根據分數排序
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	// 5. 回傳指定數量的結果
	if len(results) > req.MaxResults {
		results = results[:req.MaxResults]
	}

	return results, nil
}

// calculateOptimalMeetingPoint 計算最佳會面地點
func calculateOptimalMeetingPoint(locations []Location) Location {
	if len(locations) == 0 {
		return Location{}
	}

	if len(locations) == 1 {
		return locations[0]
	}

	// 簡單的重心計算（算術平均）
	var totalLat, totalLon float64
	for _, loc := range locations {
		totalLat += loc.Latitude
		totalLon += loc.Longitude
	}

	return Location{
		Latitude:  totalLat / float64(len(locations)),
		Longitude: totalLon / float64(len(locations)),
		Address:   "會面中心點",
	}
}

// calculateRecommendationScore 計算推薦分數
func (s *RecommendationService) calculateRecommendationScore(
	restaurant *Restaurant,
	req RecommendationRequest,
	centerLocation Location,
) *RecommendationResult {
	result := &RecommendationResult{
		Restaurant: restaurant,
	}

	// 計算距離資訊
	result.DistanceFromCenter = restaurant.CalculateDistance(centerLocation)
	
	distances := make([]float64, len(req.ParticipantLocations))
	totalDistance := 0.0
	maxDistance := 0.0
	
	for i, location := range req.ParticipantLocations {
		distance := restaurant.CalculateDistance(location)
		distances[i] = distance
		totalDistance += distance
		if distance > maxDistance {
			maxDistance = distance
		}
	}
	
	result.AverageDistance = totalDistance / float64(len(req.ParticipantLocations))
	result.MaxDistance = maxDistance

	// 計算推薦分數 (0-100)
	score := 0.0

	// 1. 距離分數 (40% 權重) - 距離越近分數越高
	distanceScore := calculateDistanceScore(result.AverageDistance, req.MaxDistance)
	score += distanceScore * 0.4

	// 2. 評分分數 (25% 權重)
	ratingScore := (restaurant.Rating / 5.0) * 100
	score += ratingScore * 0.25

	// 3. 料理偏好分數 (20% 權重)
	cuisineScore := calculateCuisineScore(restaurant.CuisineTypes, req.CuisinePreferences)
	score += cuisineScore * 0.20

	// 4. 價位適配分數 (10% 權重)
	priceScore := calculatePriceScore(restaurant.PriceLevel, req.PriceRange)
	score += priceScore * 0.10

	// 5. 飲食限制適配分數 (5% 權重)
	restrictionScore := calculateRestrictionScore(restaurant.SupportedRestrictions, req.DietaryRestrictions)
	score += restrictionScore * 0.05

	result.Score = score
	return result
}

// calculateDistanceScore 計算距離分數
func calculateDistanceScore(averageDistance, maxDistance float64) float64 {
	if averageDistance >= maxDistance {
		return 0
	}
	// 線性遞減：距離 0 分數 100，距離達到最大值分數 0
	return (1 - averageDistance/maxDistance) * 100
}

// calculateCuisineScore 計算料理偏好分數
func calculateCuisineScore(restaurantCuisines []CuisineType, preferences []CuisineType) float64 {
	if len(preferences) == 0 {
		return 80 // 沒有偏好給予中等分數
	}

	matchCount := 0
	for _, pref := range preferences {
		for _, cuisine := range restaurantCuisines {
			if pref == cuisine {
				matchCount++
				break
			}
		}
	}

	// 根據匹配比例計算分數
	matchRatio := float64(matchCount) / float64(len(preferences))
	return matchRatio * 100
}

// calculatePriceScore 計算價位適配分數
func calculatePriceScore(restaurantPriceLevel PriceLevel, priceRange *PriceRange) float64 {
	if priceRange == nil {
		return 80 // 沒有價位限制給予中等分數
	}

	restaurantMin, restaurantMax := restaurantPriceLevel.ToRange()
	
	// 檢查價位範圍重疊
	if restaurantMin <= priceRange.MaxPrice && restaurantMax >= priceRange.MinPrice {
		// 計算重疊程度
		overlapMin := maxInt(restaurantMin, priceRange.MinPrice)
		overlapMax := minInt(restaurantMax, priceRange.MaxPrice)
		overlapSize := float64(overlapMax - overlapMin)
		
		restaurantRange := float64(restaurantMax - restaurantMin)
		userRange := float64(priceRange.MaxPrice - priceRange.MinPrice)
		
		// 重疊比例越高分數越高
		overlapRatio := overlapSize / maxFloat(restaurantRange, userRange)
		return overlapRatio * 100
	}

	return 0 // 完全不重疊
}

// calculateRestrictionScore 計算飲食限制適配分數
func calculateRestrictionScore(restaurantRestrictions []DietaryRestriction, userRestrictions []DietaryRestriction) float64 {
	if len(userRestrictions) == 0 {
		return 100 // 沒有飲食限制
	}

	supportedCount := 0
	for _, userRestriction := range userRestrictions {
		for _, restaurantRestriction := range restaurantRestrictions {
			if userRestriction == restaurantRestriction {
				supportedCount++
				break
			}
		}
	}

	// 必須支援所有用戶的飲食限制
	if supportedCount == len(userRestrictions) {
		return 100
	}

	// 部分支援給予較低分數
	return float64(supportedCount) / float64(len(userRestrictions)) * 50
}

// 工具函數
func boolPtr(b bool) *bool {
	return &b
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxFloat(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}