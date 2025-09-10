package bill

import (
	"context"
	"errors"
	"time"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) CreateBill(ctx context.Context, title, description string, creatorID shared.UserID) (*Bill, error) {
	if title == "" {
		return nil, errors.New("bill title cannot be empty")
	}

	bill := NewBill(title, description, creatorID)
	
	// 自動將創建者加為參與者
	bill.AddParticipant(creatorID, "")

	err := s.repo.Save(ctx, bill)
	if err != nil {
		return nil, err
	}

	return bill, nil
}

func (s *Service) ValidateBillOperation(ctx context.Context, billID BillID, userID shared.UserID) (*Bill, error) {
	bill, err := s.repo.GetByID(ctx, billID)
	if err != nil {
		return nil, err
	}

	// 檢查用戶是否為創建者或參與者
	if bill.CreatorID.String() == userID.String() {
		return bill, nil
	}

	if _, exists := bill.Participants[userID.String()]; exists {
		return bill, nil
	}

	return nil, errors.New("user not authorized for this bill")
}

func (s *Service) CalculateBillSummary(ctx context.Context, billID BillID) (*BillSummary, error) {
	bill, err := s.repo.GetByID(ctx, billID)
	if err != nil {
		return nil, err
	}

	summary := &BillSummary{
		BillID:           billID,
		Title:            bill.Title,
		TotalAmount:      bill.TotalAmount,
		ParticipantCount: len(bill.Participants),
		ItemCount:        len(bill.Items),
		Status:           bill.Status,
		CreatedAt:        bill.CreatedAt,
	}

	totalPaid := 0.0
	totalOwed := 0.0
	paidParticipants := 0

	for _, participant := range bill.Participants {
		totalPaid += participant.PaidAmount
		totalOwed += participant.TotalAmount
		if participant.IsPaid {
			paidParticipants++
		}
	}

	summary.TotalPaid = totalPaid
	summary.TotalOwed = totalOwed
	summary.PaidParticipants = paidParticipants
	summary.IsCompletelyPaid = bill.IsCompletelyPaid()

	return summary, nil
}

func (s *Service) GetUserBillOverview(ctx context.Context, userID shared.UserID) (*UserBillOverview, error) {
	activeBills, err := s.repo.GetActiveBillsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	totalOwed := 0.0
	totalPaid := 0.0
	billCount := len(activeBills)

	for _, bill := range activeBills {
		if participant, exists := bill.Participants[userID.String()]; exists {
			totalOwed += participant.TotalAmount
			totalPaid += participant.PaidAmount
		}
	}

	return &UserBillOverview{
		UserID:       userID,
		ActiveBills:  billCount,
		TotalOwed:    totalOwed,
		TotalPaid:    totalPaid,
		Balance:      totalOwed - totalPaid,
		UpdatedAt:    time.Now(),
	}, nil
}

type BillSummary struct {
	BillID             BillID     `json:"billId"`
	Title              string     `json:"title"`
	TotalAmount        float64    `json:"totalAmount"`
	TotalPaid          float64    `json:"totalPaid"`
	TotalOwed          float64    `json:"totalOwed"`
	ParticipantCount   int        `json:"participantCount"`
	PaidParticipants   int        `json:"paidParticipants"`
	ItemCount          int        `json:"itemCount"`
	Status             BillStatus `json:"status"`
	IsCompletelyPaid   bool       `json:"isCompletelyPaid"`
	CreatedAt          time.Time  `json:"createdAt"`
}

type UserBillOverview struct {
	UserID      shared.UserID `json:"userId"`
	ActiveBills int           `json:"activeBills"`
	TotalOwed   float64       `json:"totalOwed"`
	TotalPaid   float64       `json:"totalPaid"`
	Balance     float64       `json:"balance"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}