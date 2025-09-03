package repositories

import (
	"errors"
	"sync"

	"github.com/chun-wei0413/pingnom/internal/domain/groupdining/aggregates"
)

type VoteRepositoryInMemory struct {
	votes map[string]*aggregates.Vote
	mutex sync.RWMutex
}

func NewVoteRepositoryInMemory() *VoteRepositoryInMemory {
	return &VoteRepositoryInMemory{
		votes: make(map[string]*aggregates.Vote),
		mutex: sync.RWMutex{},
	}
}

func (r *VoteRepositoryInMemory) Create(vote *aggregates.Vote) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if vote == nil {
		return errors.New("vote cannot be nil")
	}

	if _, exists := r.votes[vote.ID]; exists {
		return errors.New("vote already exists")
	}

	r.votes[vote.ID] = vote
	return nil
}

func (r *VoteRepositoryInMemory) GetByID(id string) (*aggregates.Vote, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if id == "" {
		return nil, errors.New("id cannot be empty")
	}

	vote, exists := r.votes[id]
	if !exists {
		return nil, errors.New("vote not found")
	}

	return vote, nil
}

func (r *VoteRepositoryInMemory) GetByPlanAndUser(planID, userID string) (*aggregates.Vote, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if planID == "" {
		return nil, errors.New("plan ID cannot be empty")
	}
	if userID == "" {
		return nil, errors.New("user ID cannot be empty")
	}

	for _, vote := range r.votes {
		if vote.PlanID == planID && vote.UserID == userID {
			return vote, nil
		}
	}

	return nil, errors.New("vote not found")
}

func (r *VoteRepositoryInMemory) GetByPlan(planID string) ([]*aggregates.Vote, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if planID == "" {
		return nil, errors.New("plan ID cannot be empty")
	}

	var result []*aggregates.Vote
	for _, vote := range r.votes {
		if vote.PlanID == planID {
			result = append(result, vote)
		}
	}

	return result, nil
}

func (r *VoteRepositoryInMemory) Update(vote *aggregates.Vote) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if vote == nil {
		return errors.New("vote cannot be nil")
	}

	if _, exists := r.votes[vote.ID]; !exists {
		return errors.New("vote not found")
	}

	r.votes[vote.ID] = vote
	return nil
}

func (r *VoteRepositoryInMemory) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if id == "" {
		return errors.New("id cannot be empty")
	}

	if _, exists := r.votes[id]; !exists {
		return errors.New("vote not found")
	}

	delete(r.votes, id)
	return nil
}