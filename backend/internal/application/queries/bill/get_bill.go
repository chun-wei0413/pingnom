package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	billCommands "github.com/chun-wei0413/pingnom/internal/application/commands/bill"
)

type GetBillQuery struct {
	BillID string
	UserID shared.UserID
}

type GetBillHandler struct {
	billService *bill.Service
	billRepo    bill.Repository
}

func NewGetBillHandler(billService *bill.Service, billRepo bill.Repository) *GetBillHandler {
	return &GetBillHandler{
		billService: billService,
		billRepo:    billRepo,
	}
}

func (h *GetBillHandler) Handle(ctx context.Context, query GetBillQuery) (*billCommands.BillDTO, error) {
	billID := bill.BillIDFromString(query.BillID)
	
	// 驗證用戶權限並獲取帳單
	billEntity, err := h.billService.ValidateBillOperation(ctx, billID, query.UserID)
	if err != nil {
		return nil, err
	}

	return billCommands.ToBillDTO(billEntity), nil
}