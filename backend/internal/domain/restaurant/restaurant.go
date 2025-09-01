package restaurant

import (
	"errors"
	"math"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

// Location 代表地理位置
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
}

// PriceLevel 代表價位等級
type PriceLevel int

const (
	PriceLevelUnknown PriceLevel = iota
	PriceLevelBudget              // $
	PriceLevelMidRange            // $$
	PriceLevelExpensive           // $$$
	PriceLevelVeryExpensive       // $$$$
)

func (p PriceLevel) String() string {
	switch p {
	case PriceLevelBudget:
		return "$"
	case PriceLevelMidRange:
		return "$$"
	case PriceLevelExpensive:
		return "$$$"
	case PriceLevelVeryExpensive:
		return "$$$$"
	default:
		return "Unknown"
	}
}

func (p PriceLevel) ToRange() (int, int) {
	switch p {
	case PriceLevelBudget:
		return 0, 200
	case PriceLevelMidRange:
		return 200, 500
	case PriceLevelExpensive:
		return 500, 1000
	case PriceLevelVeryExpensive:
		return 1000, 2000
	default:
		return 0, 2000
	}
}

// CuisineType 代表料理類型
type CuisineType string

const (
	CuisineTypeTaiwanese   CuisineType = "taiwanese"
	CuisineTypeChinese     CuisineType = "chinese"
	CuisineTypeJapanese    CuisineType = "japanese"
	CuisineTypeKorean      CuisineType = "korean"
	CuisineTypeWestern     CuisineType = "western"
	CuisineTypeItalian     CuisineType = "italian"
	CuisineTypeThai        CuisineType = "thai"
	CuisineTypeVietnamese  CuisineType = "vietnamese"
	CuisineTypeVegetarian  CuisineType = "vegetarian"
	CuisineTypeSeafood     CuisineType = "seafood"
	CuisineTypeBarbecue    CuisineType = "barbecue"
	CuisineTypeHotpot      CuisineType = "hotpot"
)

func (c CuisineType) DisplayName() string {
	switch c {
	case CuisineTypeTaiwanese:
		return "台式料理"
	case CuisineTypeChinese:
		return "中式料理"
	case CuisineTypeJapanese:
		return "日式料理"
	case CuisineTypeKorean:
		return "韓式料理"
	case CuisineTypeWestern:
		return "西式料理"
	case CuisineTypeItalian:
		return "義式料理"
	case CuisineTypeThai:
		return "泰式料理"
	case CuisineTypeVietnamese:
		return "越式料理"
	case CuisineTypeVegetarian:
		return "素食"
	case CuisineTypeSeafood:
		return "海鮮料理"
	case CuisineTypeBarbecue:
		return "燒烤"
	case CuisineTypeHotpot:
		return "火鍋"
	default:
		return string(c)
	}
}

// DietaryRestriction 代表飲食限制
type DietaryRestriction string

const (
	DietaryRestrictionVegetarian DietaryRestriction = "vegetarian"
	DietaryRestrictionVegan      DietaryRestriction = "vegan"
	DietaryRestrictionHalal      DietaryRestriction = "halal"
	DietaryRestrictionKosher     DietaryRestriction = "kosher"
	DietaryRestrictionGlutenFree DietaryRestriction = "gluten_free"
	DietaryRestrictionDairyFree  DietaryRestriction = "dairy_free"
	DietaryRestrictionNutFree    DietaryRestriction = "nut_free"
)

// Restaurant 代表餐廳實體
type Restaurant struct {
	ID                   shared.RestaurantID  `json:"id"`
	Name                 string               `json:"name"`
	Description          string               `json:"description"`
	Location             Location             `json:"location"`
	CuisineTypes         []CuisineType        `json:"cuisineTypes"`
	PriceLevel           PriceLevel           `json:"priceLevel"`
	Rating               float64              `json:"rating"`               // 1.0-5.0
	TotalReviews         int                  `json:"totalReviews"`
	PhoneNumber          string               `json:"phoneNumber"`
	Website              string               `json:"website,omitempty"`
	ImageURLs            []string             `json:"imageUrls,omitempty"`
	OpeningHours         map[string]string    `json:"openingHours"`         // "monday": "09:00-21:00"
	SupportedRestrictions []DietaryRestriction `json:"supportedRestrictions"` // 支援的飲食限制
	AverageWaitTime      int                  `json:"averageWaitTime"`      // 平均等候時間（分鐘）
	AcceptsReservations  bool                 `json:"acceptsReservations"`  // 是否接受預訂
	IsActive             bool                 `json:"isActive"`
	CreatedAt            time.Time            `json:"createdAt"`
	UpdatedAt            time.Time            `json:"updatedAt"`
}

// NewRestaurant 建立新的餐廳
func NewRestaurant(
	name, description string,
	location Location,
	cuisineTypes []CuisineType,
	priceLevel PriceLevel,
	phoneNumber string,
) (*Restaurant, error) {
	if name == "" {
		return nil, errors.New("restaurant name is required")
	}

	if location.Address == "" {
		return nil, errors.New("restaurant address is required")
	}

	if len(cuisineTypes) == 0 {
		return nil, errors.New("at least one cuisine type is required")
	}

	if phoneNumber == "" {
		return nil, errors.New("phone number is required")
	}

	now := time.Now()
	return &Restaurant{
		ID:                   shared.NewRestaurantID(),
		Name:                 name,
		Description:          description,
		Location:             location,
		CuisineTypes:         cuisineTypes,
		PriceLevel:           priceLevel,
		Rating:               0.0,
		TotalReviews:         0,
		PhoneNumber:          phoneNumber,
		OpeningHours:         make(map[string]string),
		SupportedRestrictions: make([]DietaryRestriction, 0),
		AverageWaitTime:      0,
		AcceptsReservations:  false,
		IsActive:             true,
		CreatedAt:            now,
		UpdatedAt:            now,
	}, nil
}

// CalculateDistance 計算與指定位置的距離（公里）
func (r *Restaurant) CalculateDistance(targetLocation Location) float64 {
	return calculateHaversineDistance(
		r.Location.Latitude, r.Location.Longitude,
		targetLocation.Latitude, targetLocation.Longitude,
	)
}

// IsOpenNow 檢查餐廳現在是否營業
func (r *Restaurant) IsOpenNow() bool {
	// 簡化版本，實際應該解析 OpeningHours 並檢查當前時間
	return r.IsActive && len(r.OpeningHours) > 0
}

// MatchesCuisinePreferences 檢查是否符合料理偏好
func (r *Restaurant) MatchesCuisinePreferences(preferences []CuisineType) bool {
	if len(preferences) == 0 {
		return true // 沒有偏好限制，所有餐廳都符合
	}

	for _, pref := range preferences {
		for _, cuisine := range r.CuisineTypes {
			if pref == cuisine {
				return true
			}
		}
	}
	return false
}

// MatchesPriceRange 檢查是否符合價位範圍
func (r *Restaurant) MatchesPriceRange(minPrice, maxPrice int) bool {
	restaurantMin, restaurantMax := r.PriceLevel.ToRange()
	
	// 檢查價位範圍是否有重疊
	return restaurantMin <= maxPrice && restaurantMax >= minPrice
}

// SupportsDietaryRestrictions 檢查是否支援飲食限制
func (r *Restaurant) SupportsDietaryRestrictions(restrictions []DietaryRestriction) bool {
	if len(restrictions) == 0 {
		return true
	}

	for _, restriction := range restrictions {
		supported := false
		for _, supported_restriction := range r.SupportedRestrictions {
			if restriction == supported_restriction {
				supported = true
				break
			}
		}
		if !supported {
			return false
		}
	}
	return true
}

// UpdateRating 更新餐廳評分
func (r *Restaurant) UpdateRating(newRating float64, incrementReviews bool) error {
	if newRating < 1.0 || newRating > 5.0 {
		return errors.New("rating must be between 1.0 and 5.0")
	}

	if incrementReviews {
		// 計算新的平均評分
		totalRating := r.Rating * float64(r.TotalReviews)
		r.TotalReviews++
		r.Rating = (totalRating + newRating) / float64(r.TotalReviews)
	} else {
		r.Rating = newRating
	}

	r.UpdatedAt = time.Now()
	return nil
}

// calculateHaversineDistance 使用 Haversine 公式計算兩點間距離（公里）
func calculateHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	// 轉換為弧度
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	// Haversine 公式
	dlat := lat2Rad - lat1Rad
	dlon := lon2Rad - lon1Rad
	
	a := math.Sin(dlat/2)*math.Sin(dlat/2) + math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dlon/2)*math.Sin(dlon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	
	return earthRadiusKm * c
}