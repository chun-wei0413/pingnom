package bill

import (
	billDomain "github.com/chun-wei0413/pingnom/internal/domain/bill"
)

type CreateBillRequest struct {
	Title       string `json:"title" validate:"required,min=1,max=100"`
	Description string `json:"description,omitempty" validate:"max=500"`
}

type CreateBillResponse struct {
	BillID      string `json:"billId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatorID   string `json:"creatorId"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
}

type AddItemRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=100"`
	Amount      float64  `json:"amount" validate:"required,gt=0"`
	Description string   `json:"description,omitempty" validate:"max=200"`
	PayerIDs    []string `json:"payerIds" validate:"required,min=1"`
}

type AddItemResponse struct {
	ItemID      string   `json:"itemId"`
	Name        string   `json:"name"`
	Amount      float64  `json:"amount"`
	Description string   `json:"description"`
	PayerIDs    []string `json:"payerIds"`
	CreatedAt   string   `json:"createdAt"`
}

type AddParticipantRequest struct {
	UserID      string `json:"userId" validate:"required"`
	DisplayName string `json:"displayName" validate:"required,min=1,max=50"`
}

type MarkPaidRequest struct {
	UserID string  `json:"userId" validate:"required"`
	Amount float64 `json:"amount" validate:"required,gte=0"`
}

type BillDTO struct {
	ID           string                 `json:"id"`
	Title        string                 `json:"title"`
	Description  string                 `json:"description"`
	CreatorID    string                 `json:"creatorId"`
	Items        []BillItemDTO          `json:"items"`
	Participants map[string]ParticipantDTO `json:"participants"`
	TotalAmount  float64                `json:"totalAmount"`
	Status       string                 `json:"status"`
	CreatedAt    string                 `json:"createdAt"`
	UpdatedAt    string                 `json:"updatedAt"`
}

type BillItemDTO struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Amount      float64  `json:"amount"`
	Description string   `json:"description"`
	PayerIDs    []string `json:"payerIds"`
	CreatedAt   string   `json:"createdAt"`
}

type ParticipantDTO struct {
	UserID      string  `json:"userId"`
	DisplayName string  `json:"displayName"`
	TotalAmount float64 `json:"totalAmount"`
	PaidAmount  float64 `json:"paidAmount"`
	IsPaid      bool    `json:"isPaid"`
	Balance     float64 `json:"balance"`
}

func ToBillDTO(bill *billDomain.Bill) *BillDTO {
	items := make([]BillItemDTO, len(bill.Items))
	for i, item := range bill.Items {
		payerIDs := make([]string, len(item.Payers))
		for j, payerID := range item.Payers {
			payerIDs[j] = payerID.String()
		}
		
		items[i] = BillItemDTO{
			ID:          item.ID,
			Name:        item.Name,
			Amount:      item.Amount,
			Description: item.Description,
			PayerIDs:    payerIDs,
			CreatedAt:   item.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	participants := make(map[string]ParticipantDTO)
	for userIDStr, participant := range bill.Participants {
		participants[userIDStr] = ParticipantDTO{
			UserID:      participant.UserID.String(),
			DisplayName: participant.DisplayName,
			TotalAmount: participant.TotalAmount,
			PaidAmount:  participant.PaidAmount,
			IsPaid:      participant.IsPaid,
			Balance:     participant.TotalAmount - participant.PaidAmount,
		}
	}

	return &BillDTO{
		ID:           bill.ID.String(),
		Title:        bill.Title,
		Description:  bill.Description,
		CreatorID:    bill.CreatorID.String(),
		Items:        items,
		Participants: participants,
		TotalAmount:  bill.TotalAmount,
		Status:       string(bill.Status),
		CreatedAt:    bill.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    bill.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}