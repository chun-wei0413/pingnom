package bill

import (
	"context"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type Repository interface {
	// 基本 CRUD 操作
	Save(ctx context.Context, bill *Bill) error
	GetByID(ctx context.Context, id BillID) (*Bill, error)
	Update(ctx context.Context, bill *Bill) error
	Delete(ctx context.Context, id BillID) error

	// 查詢操作
	GetByCreatorID(ctx context.Context, creatorID shared.UserID) ([]*Bill, error)
	GetByParticipantID(ctx context.Context, participantID shared.UserID) ([]*Bill, error)
	GetActiveBillsByUser(ctx context.Context, userID shared.UserID) ([]*Bill, error)
	
	// 統計操作
	GetTotalAmountByUser(ctx context.Context, userID shared.UserID) (float64, error)
}