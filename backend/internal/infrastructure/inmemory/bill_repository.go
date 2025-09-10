package inmemory

import (
	"context"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type InMemoryBillRepository struct {
	bills map[string]*bill.Bill // key: billID string
	mutex sync.RWMutex
}

func NewInMemoryBillRepository() *InMemoryBillRepository {
	return &InMemoryBillRepository{
		bills: make(map[string]*bill.Bill),
		mutex: sync.RWMutex{},
	}
}

func (r *InMemoryBillRepository) Save(ctx context.Context, b *bill.Bill) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	r.bills[b.ID.String()] = b
	return nil
}

func (r *InMemoryBillRepository) GetByID(ctx context.Context, id bill.BillID) (*bill.Bill, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	b, exists := r.bills[id.String()]
	if !exists {
		return nil, shared.ErrBillNotFound
	}
	
	return b, nil
}

func (r *InMemoryBillRepository) Update(ctx context.Context, b *bill.Bill) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.bills[b.ID.String()]; !exists {
		return shared.ErrBillNotFound
	}
	
	r.bills[b.ID.String()] = b
	return nil
}

func (r *InMemoryBillRepository) Delete(ctx context.Context, id bill.BillID) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.bills[id.String()]; !exists {
		return shared.ErrBillNotFound
	}
	
	delete(r.bills, id.String())
	return nil
}

func (r *InMemoryBillRepository) GetByCreatorID(ctx context.Context, creatorID shared.UserID) ([]*bill.Bill, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var createdBills []*bill.Bill
	
	for _, b := range r.bills {
		if b.CreatorID.String() == creatorID.String() {
			createdBills = append(createdBills, b)
		}
	}
	
	return createdBills, nil
}

func (r *InMemoryBillRepository) GetByParticipantID(ctx context.Context, participantID shared.UserID) ([]*bill.Bill, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var participantBills []*bill.Bill
	
	for _, b := range r.bills {
		if _, exists := b.Participants[participantID.String()]; exists {
			participantBills = append(participantBills, b)
		}
	}
	
	return participantBills, nil
}

func (r *InMemoryBillRepository) GetActiveBillsByUser(ctx context.Context, userID shared.UserID) ([]*bill.Bill, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var activeBills []*bill.Bill
	userIDStr := userID.String()
	
	for _, b := range r.bills {
		if b.Status == bill.BillStatusActive {
			// 檢查是否為創建者或參與者
			if b.CreatorID.String() == userIDStr {
				activeBills = append(activeBills, b)
			} else if _, exists := b.Participants[userIDStr]; exists {
				activeBills = append(activeBills, b)
			}
		}
	}
	
	return activeBills, nil
}

func (r *InMemoryBillRepository) GetTotalAmountByUser(ctx context.Context, userID shared.UserID) (float64, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	totalAmount := 0.0
	userIDStr := userID.String()
	
	for _, b := range r.bills {
		if participant, exists := b.Participants[userIDStr]; exists {
			totalAmount += participant.TotalAmount
		}
	}
	
	return totalAmount, nil
}

func (r *InMemoryBillRepository) GetAll() []*bill.Bill {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var allBills []*bill.Bill
	for _, b := range r.bills {
		allBills = append(allBills, b)
	}
	
	return allBills
}