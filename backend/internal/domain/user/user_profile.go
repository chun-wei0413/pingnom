package user

import (
	"errors"
	"strings"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type UserProfile struct {
	DisplayName      string             `json:"displayName"`
	Avatar          string             `json:"avatar,omitempty"`
	Bio             string             `json:"bio,omitempty"`
	DefaultLocations []shared.Location  `json:"defaultLocations,omitempty"`
}

func NewUserProfile(displayName, avatar, bio string, locations []shared.Location) (UserProfile, error) {
	if strings.TrimSpace(displayName) == "" {
		return UserProfile{}, errors.New("display name cannot be empty")
	}
	
	if len(displayName) > 100 {
		return UserProfile{}, errors.New("display name cannot exceed 100 characters")
	}
	
	if len(bio) > 500 {
		return UserProfile{}, errors.New("bio cannot exceed 500 characters")
	}
	
	if len(locations) > 5 {
		return UserProfile{}, errors.New("cannot have more than 5 default locations")
	}
	
	return UserProfile{
		DisplayName:      strings.TrimSpace(displayName),
		Avatar:          strings.TrimSpace(avatar),
		Bio:             strings.TrimSpace(bio),
		DefaultLocations: locations,
	}, nil
}

func (p UserProfile) IsComplete() bool {
	return strings.TrimSpace(p.DisplayName) != ""
}

type DietaryPreferences struct {
	CuisineTypes []string   `json:"cuisineTypes,omitempty"`
	Restrictions []string   `json:"restrictions,omitempty"`
	PriceRange   PriceRange `json:"priceRange"`
}

type PriceRange struct {
	Min int `json:"min"`
	Max int `json:"max"`
}

func NewDietaryPreferences(cuisines, restrictions []string, minPrice, maxPrice int) (DietaryPreferences, error) {
	if minPrice < 0 || maxPrice < 0 {
		return DietaryPreferences{}, errors.New("price cannot be negative")
	}
	
	if minPrice > maxPrice {
		return DietaryPreferences{}, errors.New("minimum price cannot be greater than maximum price")
	}
	
	return DietaryPreferences{
		CuisineTypes: cuisines,
		Restrictions: restrictions,
		PriceRange: PriceRange{
			Min: minPrice,
			Max: maxPrice,
		},
	}, nil
}

type PrivacySettings struct {
	IsDiscoverable     bool `json:"isDiscoverable"`
	ShowLocation       bool `json:"showLocation"`
	AllowFriendRequest bool `json:"allowFriendRequest"`
}

func DefaultPrivacySettings() PrivacySettings {
	return PrivacySettings{
		IsDiscoverable:     true,
		ShowLocation:       true,
		AllowFriendRequest: true,
	}
}