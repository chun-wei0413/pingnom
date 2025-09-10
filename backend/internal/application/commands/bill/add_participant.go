package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type AddParticipantCommand struct {
	BillID  string
	Request AddParticipantRequest
	UserID  shared.UserID
}

type AddParticipantHandler struct {
	billService *bill.Service
	billRepo    bill.Repository
}

func NewAddParticipantHandler(billService *bill.Service, billRepo bill.Repository) *AddParticipantHandler {
	return &AddParticipantHandler{
		billService: billService,
		billRepo:    billRepo,
	}
}

func (h *AddParticipantHandler) Handle(ctx context.Context, cmd AddParticipantCommand) error {
	billID := bill.BillIDFromString(cmd.BillID)
	
	// 驗證用戶權限
	billEntity, err := h.billService.ValidateBillOperation(ctx, billID, cmd.UserID)
	if err != nil {
		return err
	}

	// 新增參與者
	participantUserID := shared.UserIDFromString(cmd.Request.UserID)
	billEntity.AddParticipant(participantUserID, cmd.Request.DisplayName)

	// 更新帳單
	return h.billRepo.Update(ctx, billEntity)
}