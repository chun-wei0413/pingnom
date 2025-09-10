package bill

import (
	"errors"
	"time"

	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type BillStatus string

const (
	BillStatusDraft     BillStatus = "draft"
	BillStatusActive    BillStatus = "active"
	BillStatusCompleted BillStatus = "completed"
	BillStatusCancelled BillStatus = "cancelled"
)

type BillItem struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Amount      float64          `json:"amount"`
	Description string           `json:"description,omitempty"`
	Payers      []shared.UserID  `json:"payers"` // 分攤此項目的用戶
	CreatedAt   time.Time        `json:"createdAt"`
}

type BillParticipant struct {
	UserID       shared.UserID `json:"userId"`
	DisplayName  string        `json:"displayName"`
	TotalAmount  float64       `json:"totalAmount"`
	PaidAmount   float64       `json:"paidAmount"`
	IsPaid       bool          `json:"isPaid"`
}

type Bill struct {
	ID           BillID                     `json:"id"`
	Title        string                     `json:"title"`
	Description  string                     `json:"description,omitempty"`
	CreatorID    shared.UserID              `json:"creatorId"`
	Items        []BillItem                 `json:"items"`
	Participants map[string]BillParticipant `json:"participants"` // key: UserID
	TotalAmount  float64                    `json:"totalAmount"`
	Status       BillStatus                 `json:"status"`
	CreatedAt    time.Time                  `json:"createdAt"`
	UpdatedAt    time.Time                  `json:"updatedAt"`
}

func NewBill(title, description string, creatorID shared.UserID) *Bill {
	return &Bill{
		ID:           NewBillID(),
		Title:        title,
		Description:  description,
		CreatorID:    creatorID,
		Items:        []BillItem{},
		Participants: make(map[string]BillParticipant),
		TotalAmount:  0,
		Status:       BillStatusDraft,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

func (b *Bill) AddItem(name string, amount float64, description string, payerIDs []shared.UserID) (*BillItem, error) {
	if name == "" {
		return nil, errors.New("item name cannot be empty")
	}
	if amount <= 0 {
		return nil, errors.New("item amount must be positive")
	}
	if len(payerIDs) == 0 {
		return nil, errors.New("at least one payer is required")
	}

	item := BillItem{
		ID:          shared.NewUserID().String(), // 簡單使用 UUID
		Name:        name,
		Amount:      amount,
		Description: description,
		Payers:      payerIDs,
		CreatedAt:   time.Now(),
	}

	b.Items = append(b.Items, item)
	b.UpdatedAt = time.Now()
	b.calculateTotals()

	return &item, nil
}

func (b *Bill) RemoveItem(itemID string) error {
	for i, item := range b.Items {
		if item.ID == itemID {
			// 移除項目
			b.Items = append(b.Items[:i], b.Items[i+1:]...)
			b.UpdatedAt = time.Now()
			b.calculateTotals()
			return nil
		}
	}
	return errors.New("item not found")
}

func (b *Bill) AddParticipant(userID shared.UserID, displayName string) {
	b.Participants[userID.String()] = BillParticipant{
		UserID:      userID,
		DisplayName: displayName,
		TotalAmount: 0,
		PaidAmount:  0,
		IsPaid:      false,
	}
	b.UpdatedAt = time.Now()
	b.calculateTotals()
}

func (b *Bill) RemoveParticipant(userID shared.UserID) error {
	userIDStr := userID.String()
	if _, exists := b.Participants[userIDStr]; !exists {
		return errors.New("participant not found")
	}

	// 檢查是否有項目涉及此參與者
	for _, item := range b.Items {
		for _, payerID := range item.Payers {
			if payerID.String() == userIDStr {
				return errors.New("cannot remove participant who is assigned to bill items")
			}
		}
	}

	delete(b.Participants, userIDStr)
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Bill) MarkParticipantPaid(userID shared.UserID, amount float64) error {
	userIDStr := userID.String()
	participant, exists := b.Participants[userIDStr]
	if !exists {
		return errors.New("participant not found")
	}

	participant.PaidAmount = amount
	participant.IsPaid = (amount >= participant.TotalAmount)
	b.Participants[userIDStr] = participant
	b.UpdatedAt = time.Now()

	return nil
}

func (b *Bill) Activate() error {
	if b.Status != BillStatusDraft {
		return errors.New("can only activate draft bills")
	}
	if len(b.Items) == 0 {
		return errors.New("cannot activate bill without items")
	}
	if len(b.Participants) == 0 {
		return errors.New("cannot activate bill without participants")
	}

	b.Status = BillStatusActive
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Bill) Complete() error {
	if b.Status != BillStatusActive {
		return errors.New("can only complete active bills")
	}

	b.Status = BillStatusCompleted
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Bill) Cancel() error {
	if b.Status == BillStatusCompleted {
		return errors.New("cannot cancel completed bills")
	}

	b.Status = BillStatusCancelled
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Bill) calculateTotals() {
	// 重設所有參與者金額
	for userIDStr, participant := range b.Participants {
		participant.TotalAmount = 0
		b.Participants[userIDStr] = participant
	}

	totalAmount := 0.0

	// 計算每個項目的分攤
	for _, item := range b.Items {
		totalAmount += item.Amount
		if len(item.Payers) > 0 {
			perPersonAmount := item.Amount / float64(len(item.Payers))
			for _, payerID := range item.Payers {
				userIDStr := payerID.String()
				if participant, exists := b.Participants[userIDStr]; exists {
					participant.TotalAmount += perPersonAmount
					b.Participants[userIDStr] = participant
				}
			}
		}
	}

	b.TotalAmount = totalAmount
}

func (b *Bill) IsCompletelyPaid() bool {
	if b.Status != BillStatusActive {
		return false
	}
	
	for _, participant := range b.Participants {
		if !participant.IsPaid {
			return false
		}
	}
	return true
}

func (b *Bill) GetParticipantBalance(userID shared.UserID) (float64, bool) {
	participant, exists := b.Participants[userID.String()]
	if !exists {
		return 0, false
	}
	
	balance := participant.TotalAmount - participant.PaidAmount
	return balance, true
}