package repositories

import (
	"errors"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type GroupDiningPlanRepositoryInMemory struct {
	plans map[string]*aggregates.GroupDiningPlan
	mutex sync.RWMutex
}

func NewGroupDiningPlanRepositoryInMemory() *GroupDiningPlanRepositoryInMemory {
	return &GroupDiningPlanRepositoryInMemory{
		plans: make(map[string]*aggregates.GroupDiningPlan),
		mutex: sync.RWMutex{},
	}
}

func (r *GroupDiningPlanRepositoryInMemory) Create(plan *aggregates.GroupDiningPlan) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if plan == nil {
		return errors.New("plan cannot be nil")
	}

	if _, exists := r.plans[plan.ID]; exists {
		return errors.New("group dining plan already exists")
	}

	r.plans[plan.ID] = plan
	return nil
}

func (r *GroupDiningPlanRepositoryInMemory) GetByID(id string) (*aggregates.GroupDiningPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if id == "" {
		return nil, errors.New("id cannot be empty")
	}

	plan, exists := r.plans[id]
	if !exists {
		return nil, errors.New("group dining plan not found")
	}

	return plan, nil
}

func (r *GroupDiningPlanRepositoryInMemory) GetByCreator(createdBy string) ([]*aggregates.GroupDiningPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if createdBy == "" {
		return nil, errors.New("creator ID cannot be empty")
	}

	var result []*aggregates.GroupDiningPlan
	for _, plan := range r.plans {
		if plan.CreatedBy == createdBy {
			result = append(result, plan)
		}
	}

	return result, nil
}

func (r *GroupDiningPlanRepositoryInMemory) GetByParticipant(userID string) ([]*aggregates.GroupDiningPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if userID == "" {
		return nil, errors.New("user ID cannot be empty")
	}

	var result []*aggregates.GroupDiningPlan
	for _, plan := range r.plans {
		if plan.IsParticipant(userID) {
			result = append(result, plan)
		}
	}

	return result, nil
}

func (r *GroupDiningPlanRepositoryInMemory) Update(plan *aggregates.GroupDiningPlan) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if plan == nil {
		return errors.New("plan cannot be nil")
	}

	if _, exists := r.plans[plan.ID]; !exists {
		return errors.New("group dining plan not found")
	}

	r.plans[plan.ID] = plan
	return nil
}

func (r *GroupDiningPlanRepositoryInMemory) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if id == "" {
		return errors.New("id cannot be empty")
	}

	if _, exists := r.plans[id]; !exists {
		return errors.New("group dining plan not found")
	}

	delete(r.plans, id)
	return nil
}

func (r *GroupDiningPlanRepositoryInMemory) List(limit, offset int) ([]*aggregates.GroupDiningPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var result []*aggregates.GroupDiningPlan
	count := 0
	for _, plan := range r.plans {
		if count < offset {
			count++
			continue
		}
		if len(result) >= limit {
			break
		}
		result = append(result, plan)
		count++
	}

	return result, nil
}