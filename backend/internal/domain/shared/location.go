package shared

import (
	"errors"
	"math"
)

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address,omitempty"`
}

func NewLocation(lat, lng float64, address string) (Location, error) {
	if !isValidLatitude(lat) {
		return Location{}, errors.New("latitude must be between -90 and 90")
	}
	
	if !isValidLongitude(lng) {
		return Location{}, errors.New("longitude must be between -180 and 180")
	}
	
	return Location{
		Latitude:  lat,
		Longitude: lng,
		Address:   address,
	}, nil
}

func (l Location) DistanceTo(other Location) float64 {
	return haversineDistance(l.Latitude, l.Longitude, other.Latitude, other.Longitude)
}

func (l Location) Equals(other Location) bool {
	return math.Abs(l.Latitude-other.Latitude) < 0.0001 && 
		   math.Abs(l.Longitude-other.Longitude) < 0.0001
}

func isValidLatitude(lat float64) bool {
	return lat >= -90 && lat <= 90
}

func isValidLongitude(lng float64) bool {
	return lng >= -180 && lng <= 180
}

// haversineDistance 計算兩點間的距離 (公里)
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371 // 地球半徑 (公里)
	
	dLat := toRadians(lat2 - lat1)
	dLon := toRadians(lon2 - lon1)
	
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRadians(lat1))*math.Cos(toRadians(lat2))*
		math.Sin(dLon/2)*math.Sin(dLon/2)
	
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	
	return earthRadius * c
}

func toRadians(degrees float64) float64 {
	return degrees * (math.Pi / 180)
}