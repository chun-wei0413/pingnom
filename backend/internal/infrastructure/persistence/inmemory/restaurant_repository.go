package inmemory

import (
	"context"
	"sort"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/restaurant"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// RestaurantRepository InMemory 餐廳儲存庫實作
type RestaurantRepository struct {
	restaurants map[string]*restaurant.Restaurant
	mu          sync.RWMutex
}

// NewRestaurantRepository 建立新的 InMemory 餐廳儲存庫
func NewRestaurantRepository() *RestaurantRepository {
	return &RestaurantRepository{
		restaurants: make(map[string]*restaurant.Restaurant),
	}
}

// Create 建立新餐廳
func (r *RestaurantRepository) Create(ctx context.Context, rest *restaurant.Restaurant) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.restaurants[rest.ID.String()] = rest
	return nil
}

// FindByID 根據 ID 尋找餐廳
func (r *RestaurantRepository) FindByID(ctx context.Context, id shared.RestaurantID) (*restaurant.Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rest, exists := r.restaurants[id.String()]
	if !exists {
		return nil, shared.ErrRestaurantNotFound
	}

	return rest, nil
}

// FindByLocation 根據位置範圍尋找餐廳
func (r *RestaurantRepository) FindByLocation(ctx context.Context, centerLat, centerLon, radiusKm float64) ([]*restaurant.Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	centerLocation := restaurant.Location{
		Latitude:  centerLat,
		Longitude: centerLon,
	}

	var results []*restaurant.Restaurant
	for _, rest := range r.restaurants {
		if !rest.IsActive {
			continue
		}

		distance := rest.CalculateDistance(centerLocation)
		if distance <= radiusKm {
			results = append(results, rest)
		}
	}

	// 按距離排序
	sort.Slice(results, func(i, j int) bool {
		distanceI := results[i].CalculateDistance(centerLocation)
		distanceJ := results[j].CalculateDistance(centerLocation)
		return distanceI < distanceJ
	})

	return results, nil
}

// FindNearby 尋找附近的餐廳
func (r *RestaurantRepository) FindNearby(ctx context.Context, location restaurant.Location, radiusKm float64, criteria restaurant.SearchCriteria) ([]*restaurant.Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var results []*restaurant.Restaurant
	for _, rest := range r.restaurants {
		if !rest.IsActive {
			continue
		}

		distance := rest.CalculateDistance(location)
		if distance <= radiusKm {
			// 檢查其他篩選條件
			if r.matchesCriteria(rest, criteria) {
				results = append(results, rest)
			}
		}
	}

	// 排序
	r.sortResults(results, criteria, location)

	// 分頁
	if criteria.Limit > 0 {
		start := criteria.Offset
		end := start + criteria.Limit
		if start < len(results) {
			if end > len(results) {
				end = len(results)
			}
			results = results[start:end]
		} else {
			results = []*restaurant.Restaurant{}
		}
	}

	return results, nil
}

// Update 更新餐廳資訊
func (r *RestaurantRepository) Update(ctx context.Context, rest *restaurant.Restaurant) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.restaurants[rest.ID.String()]; !exists {
		return shared.ErrRestaurantNotFound
	}

	r.restaurants[rest.ID.String()] = rest
	return nil
}

// Delete 刪除餐廳
func (r *RestaurantRepository) Delete(ctx context.Context, id shared.RestaurantID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.restaurants[id.String()]; !exists {
		return shared.ErrRestaurantNotFound
	}

	delete(r.restaurants, id.String())
	return nil
}

// FindAll 獲取所有餐廳 (分頁)
func (r *RestaurantRepository) FindAll(ctx context.Context, limit, offset int) ([]*restaurant.Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var results []*restaurant.Restaurant
	for _, rest := range r.restaurants {
		if rest.IsActive {
			results = append(results, rest)
		}
	}

	// 按名稱排序
	sort.Slice(results, func(i, j int) bool {
		return results[i].Name < results[j].Name
	})

	// 分頁
	start := offset
	end := start + limit
	if start < len(results) {
		if end > len(results) {
			end = len(results)
		}
		return results[start:end], nil
	}

	return []*restaurant.Restaurant{}, nil
}

// Search 根據條件搜尋餐廳
func (r *RestaurantRepository) Search(ctx context.Context, criteria restaurant.SearchCriteria) ([]*restaurant.Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var results []*restaurant.Restaurant
	for _, rest := range r.restaurants {
		if r.matchesCriteria(rest, criteria) {
			results = append(results, rest)
		}
	}

	// 排序
	var centerLocation restaurant.Location
	if criteria.CenterLocation != nil {
		centerLocation = *criteria.CenterLocation
	}
	r.sortResults(results, criteria, centerLocation)

	// 分頁
	if criteria.Limit > 0 {
		start := criteria.Offset
		end := start + criteria.Limit
		if start < len(results) {
			if end > len(results) {
				end = len(results)
			}
			results = results[start:end]
		} else {
			results = []*restaurant.Restaurant{}
		}
	}

	return results, nil
}

// matchesCriteria 檢查餐廳是否符合篩選條件
func (r *RestaurantRepository) matchesCriteria(rest *restaurant.Restaurant, criteria restaurant.SearchCriteria) bool {
	// 檢查活躍狀態
	if criteria.IsActive != nil && rest.IsActive != *criteria.IsActive {
		return false
	}

	// 檢查位置範圍
	if criteria.CenterLocation != nil && criteria.RadiusKm > 0 {
		distance := rest.CalculateDistance(*criteria.CenterLocation)
		if distance > criteria.RadiusKm {
			return false
		}
	}

	// 檢查料理類型
	if len(criteria.CuisineTypes) > 0 {
		if !rest.MatchesCuisinePreferences(criteria.CuisineTypes) {
			return false
		}
	}

	// 檢查價位範圍
	if criteria.PriceRange != nil {
		if !rest.MatchesPriceRange(criteria.PriceRange.MinPrice, criteria.PriceRange.MaxPrice) {
			return false
		}
	}

	// 檢查飲食限制
	if len(criteria.DietaryRestrictions) > 0 {
		if !rest.SupportsDietaryRestrictions(criteria.DietaryRestrictions) {
			return false
		}
	}

	// 檢查最低評分
	if criteria.MinRating > 0 && rest.Rating < criteria.MinRating {
		return false
	}

	// 檢查預約支援
	if criteria.AcceptsReservations != nil && rest.AcceptsReservations != *criteria.AcceptsReservations {
		return false
	}

	return true
}

// sortResults 對結果進行排序
func (r *RestaurantRepository) sortResults(results []*restaurant.Restaurant, criteria restaurant.SearchCriteria, centerLocation restaurant.Location) {
	switch criteria.SortBy {
	case restaurant.SortByDistance:
		if criteria.CenterLocation != nil {
			sort.Slice(results, func(i, j int) bool {
				distanceI := results[i].CalculateDistance(centerLocation)
				distanceJ := results[j].CalculateDistance(centerLocation)
				if criteria.SortOrder == restaurant.OrderDesc {
					return distanceI > distanceJ
				}
				return distanceI < distanceJ
			})
		}
	case restaurant.SortByRating:
		sort.Slice(results, func(i, j int) bool {
			if criteria.SortOrder == restaurant.OrderDesc {
				return results[i].Rating > results[j].Rating
			}
			return results[i].Rating < results[j].Rating
		})
	case restaurant.SortByPrice:
		sort.Slice(results, func(i, j int) bool {
			priceI, _ := results[i].PriceLevel.ToRange()
			priceJ, _ := results[j].PriceLevel.ToRange()
			if criteria.SortOrder == restaurant.OrderDesc {
				return priceI > priceJ
			}
			return priceI < priceJ
		})
	case restaurant.SortByName:
		fallthrough
	default:
		sort.Slice(results, func(i, j int) bool {
			if criteria.SortOrder == restaurant.OrderDesc {
				return results[i].Name > results[j].Name
			}
			return results[i].Name < results[j].Name
		})
	}
}