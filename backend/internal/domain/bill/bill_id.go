package bill

import (
	"github.com/google/uuid"
)

type BillID struct {
	value string
}

func NewBillID() BillID {
	return BillID{
		value: uuid.New().String(),
	}
}

func BillIDFromString(s string) BillID {
	return BillID{
		value: s,
	}
}

func (b BillID) String() string {
	return b.value
}

func (b BillID) IsEmpty() bool {
	return b.value == ""
}