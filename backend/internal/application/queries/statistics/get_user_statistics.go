package statistics

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	"github.com/chun-wei0413/pingnom/internal/domain/statistics"
)

// GetUserStatisticsQuery represents the query to get user statistics
type GetUserStatisticsQuery struct {
	UserID shared.UserID
}

// GetUserStatisticsHandler handles the retrieval of user statistics
type GetUserStatisticsHandler struct {
	service *statistics.StatisticsService
}

// NewGetUserStatisticsHandler creates a new handler
func NewGetUserStatisticsHandler(service *statistics.StatisticsService) *GetUserStatisticsHandler {
	return &GetUserStatisticsHandler{
		service: service,
	}
}

// Handle processes the get user statistics query
func (h *GetUserStatisticsHandler) Handle(ctx context.Context, query GetUserStatisticsQuery) (*statistics.UserStatistics, error) {
	return h.service.GenerateUserStatistics(ctx, query.UserID)
}