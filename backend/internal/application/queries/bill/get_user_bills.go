package bill

import (
	"context"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
	billCommands "github.com/chun-wei0413/pingnom/internal/application/commands/bill"
)

type GetUserBillsQuery struct {
	UserID shared.UserID
	Filter string // "created", "participant", "all"
}

type GetUserBillsResponse struct {
	Bills []billCommands.BillDTO `json:"bills"`
	Total int                    `json:"total"`
}

type GetUserBillsHandler struct {
	billRepo bill.Repository
}

func NewGetUserBillsHandler(billRepo bill.Repository) *GetUserBillsHandler {
	return &GetUserBillsHandler{
		billRepo: billRepo,
	}
}

func (h *GetUserBillsHandler) Handle(ctx context.Context, query GetUserBillsQuery) (*GetUserBillsResponse, error) {
	var bills []*bill.Bill
	var err error

	switch query.Filter {
	case "created":
		bills, err = h.billRepo.GetByCreatorID(ctx, query.UserID)
	case "participant":
		bills, err = h.billRepo.GetByParticipantID(ctx, query.UserID)
	default: // "all" or empty
		createdBills, err1 := h.billRepo.GetByCreatorID(ctx, query.UserID)
		participantBills, err2 := h.billRepo.GetByParticipantID(ctx, query.UserID)
		
		if err1 != nil {
			return nil, err1
		}
		if err2 != nil {
			return nil, err2
		}

		// 合併並去重
		billMap := make(map[string]*bill.Bill)
		for _, bill := range createdBills {
			billMap[bill.ID.String()] = bill
		}
		for _, bill := range participantBills {
			billMap[bill.ID.String()] = bill
		}

		bills = make([]*bill.Bill, 0, len(billMap))
		for _, bill := range billMap {
			bills = append(bills, bill)
		}
	}

	if err != nil {
		return nil, err
	}

	billDTOs := make([]billCommands.BillDTO, len(bills))
	for i, bill := range bills {
		billDTOs[i] = *billCommands.ToBillDTO(bill)
	}

	return &GetUserBillsResponse{
		Bills: billDTOs,
		Total: len(billDTOs),
	}, nil
}