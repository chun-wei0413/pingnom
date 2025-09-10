package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type MarkPaidCommand struct {
	BillID  string
	Request MarkPaidRequest
	UserID  shared.UserID
}

type MarkPaidHandler struct {
	billService *bill.Service
	billRepo    bill.Repository
}

func NewMarkPaidHandler(billService *bill.Service, billRepo bill.Repository) *MarkPaidHandler {
	return &MarkPaidHandler{
		billService: billService,
		billRepo:    billRepo,
	}
}

func (h *MarkPaidHandler) Handle(ctx context.Context, cmd MarkPaidCommand) error {
	billID := bill.BillIDFromString(cmd.BillID)
	
	// 驗證用戶權限
	billEntity, err := h.billService.ValidateBillOperation(ctx, billID, cmd.UserID)
	if err != nil {
		return err
	}

	// 標記付款
	targetUserID := shared.UserIDFromString(cmd.Request.UserID)
	err = billEntity.MarkParticipantPaid(targetUserID, cmd.Request.Amount)
	if err != nil {
		return err
	}

	// 如果帳單完全付清，自動完成
	if billEntity.IsCompletelyPaid() {
		billEntity.Complete()
	}

	// 更新帳單
	return h.billRepo.Update(ctx, billEntity)
}