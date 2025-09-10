package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type CreateBillCommand struct {
	Request CreateBillRequest
	UserID  shared.UserID
}

type CreateBillHandler struct {
	billService *bill.Service
}

func NewCreateBillHandler(billService *bill.Service) *CreateBillHandler {
	return &CreateBillHandler{
		billService: billService,
	}
}

func (h *CreateBillHandler) Handle(ctx context.Context, cmd CreateBillCommand) (*CreateBillResponse, error) {
	createdBill, err := h.billService.CreateBill(ctx, cmd.Request.Title, cmd.Request.Description, cmd.UserID)
	if err != nil {
		return nil, err
	}

	return &CreateBillResponse{
		BillID:      createdBill.ID.String(),
		Title:       createdBill.Title,
		Description: createdBill.Description,
		CreatorID:   createdBill.CreatorID.String(),
		Status:      string(createdBill.Status),
		CreatedAt:   createdBill.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}