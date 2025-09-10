package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type AddItemCommand struct {
	BillID  string
	Request AddItemRequest
	UserID  shared.UserID
}

type AddItemHandler struct {
	billService *bill.Service
	billRepo    bill.Repository
}

func NewAddItemHandler(billService *bill.Service, billRepo bill.Repository) *AddItemHandler {
	return &AddItemHandler{
		billService: billService,
		billRepo:    billRepo,
	}
}

func (h *AddItemHandler) Handle(ctx context.Context, cmd AddItemCommand) (*AddItemResponse, error) {
	billID := bill.BillIDFromString(cmd.BillID)
	
	// 驗證用戶權限
	billEntity, err := h.billService.ValidateBillOperation(ctx, billID, cmd.UserID)
	if err != nil {
		return nil, err
	}

	// 轉換 PayerIDs 為 shared.UserID
	payerIDs := make([]shared.UserID, len(cmd.Request.PayerIDs))
	for i, payerIDStr := range cmd.Request.PayerIDs {
		payerIDs[i] = shared.UserIDFromString(payerIDStr)
	}

	// 新增項目
	item, err := billEntity.AddItem(
		cmd.Request.Name,
		cmd.Request.Amount,
		cmd.Request.Description,
		payerIDs,
	)
	if err != nil {
		return nil, err
	}

	// 更新帳單
	err = h.billRepo.Update(ctx, billEntity)
	if err != nil {
		return nil, err
	}

	payerIDStrings := make([]string, len(item.Payers))
	for i, payerID := range item.Payers {
		payerIDStrings[i] = payerID.String()
	}

	return &AddItemResponse{
		ItemID:      item.ID,
		Name:        item.Name,
		Amount:      item.Amount,
		Description: item.Description,
		PayerIDs:    payerIDStrings,
		CreatedAt:   item.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}