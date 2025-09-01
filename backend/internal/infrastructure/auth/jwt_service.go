package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type JWTService struct {
	secretKey     string
	tokenDuration time.Duration
}

type Claims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
	jwt.RegisteredClaims
}

func NewJWTService(secretKey string, tokenDuration time.Duration) *JWTService {
	return &JWTService{
		secretKey:     secretKey,
		tokenDuration: tokenDuration,
	}
}

func (j *JWTService) GenerateToken(userID shared.UserID, email string) (string, error) {
	now := time.Now()
	expiresAt := now.Add(j.tokenDuration)

	claims := &Claims{
		UserID:    userID.String(),
		Email:     email,
		IssuedAt:  now.Unix(),
		ExpiresAt: expiresAt.Unix(),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			Issuer:    "pingnom-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

func (j *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 確保使用的是 HMAC 簽名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// 額外檢查過期時間
	if time.Unix(claims.ExpiresAt, 0).Before(time.Now()) {
		return nil, ErrExpiredToken
	}

	return claims, nil
}

func (j *JWTService) RefreshToken(tokenString string) (string, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// 解析 UserID
	userID, err := shared.NewUserIDFromString(claims.UserID)
	if err != nil {
		return "", ErrInvalidToken
	}

	// 生成新的 token
	return j.GenerateToken(userID, claims.Email)
}

func (j *JWTService) ExtractUserID(tokenString string) (shared.UserID, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return shared.UserID{}, err
	}

	return shared.NewUserIDFromString(claims.UserID)
}