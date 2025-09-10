package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	billcommands "github.com/chun-wei0413/pingnom/internal/application/commands/bill"
	billqueries "github.com/chun-wei0413/pingnom/internal/application/queries/bill"
	"github.com/chun-wei0413/pingnom/internal/domain/shared"
)

type BillHandler struct {
	createBillHandler     *billcommands.CreateBillHandler
	addItemHandler        *billcommands.AddItemHandler
	addParticipantHandler *billcommands.AddParticipantHandler
	markPaidHandler       *billcommands.MarkPaidHandler
	getBillHandler        *billqueries.GetBillHandler
	getUserBillsHandler   *billqueries.GetUserBillsHandler
}

func NewBillHandler(
	createBillHandler *billcommands.CreateBillHandler,
	addItemHandler *billcommands.AddItemHandler,
	addParticipantHandler *billcommands.AddParticipantHandler,
	markPaidHandler *billcommands.MarkPaidHandler,
	getBillHandler *billqueries.GetBillHandler,
	getUserBillsHandler *billqueries.GetUserBillsHandler,
) *BillHandler {
	return &BillHandler{
		createBillHandler:     createBillHandler,
		addItemHandler:        addItemHandler,
		addParticipantHandler: addParticipantHandler,
		markPaidHandler:       markPaidHandler,
		getBillHandler:        getBillHandler,
		getUserBillsHandler:   getUserBillsHandler,
	}
}

// POST /api/v1/bills
func (h *BillHandler) CreateBill(c *gin.Context) {
	var request billcommands.CreateBillRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cmd := billcommands.CreateBillCommand{
		Request: request,
		UserID:  shared.UserIDFromString(userID.(string)),
	}

	response, err := h.createBillHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create bill",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GET /api/v1/bills/:id
func (h *BillHandler) GetBill(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bill ID is required"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	query := billqueries.GetBillQuery{
		BillID: billID,
		UserID: shared.UserIDFromString(userID.(string)),
	}

	bill, err := h.getBillHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Bill not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, bill)
}

// GET /api/v1/bills
func (h *BillHandler) GetUserBills(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	filter := c.DefaultQuery("filter", "all")

	query := billqueries.GetUserBillsQuery{
		UserID: shared.UserIDFromString(userID.(string)),
		Filter: filter,
	}

	response, err := h.getUserBillsHandler.Handle(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user bills",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// POST /api/v1/bills/:id/items
func (h *BillHandler) AddItem(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bill ID is required"})
		return
	}

	var request billcommands.AddItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cmd := billcommands.AddItemCommand{
		BillID:  billID,
		Request: request,
		UserID:  shared.UserIDFromString(userID.(string)),
	}

	response, err := h.addItemHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to add item",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// POST /api/v1/bills/:id/participants
func (h *BillHandler) AddParticipant(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bill ID is required"})
		return
	}

	var request billcommands.AddParticipantRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cmd := billcommands.AddParticipantCommand{
		BillID:  billID,
		Request: request,
		UserID:  shared.UserIDFromString(userID.(string)),
	}

	err := h.addParticipantHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to add participant",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Participant added successfully"})
}

// PUT /api/v1/bills/:id/payments
func (h *BillHandler) MarkPaid(c *gin.Context) {
	billID := c.Param("id")
	if billID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bill ID is required"})
		return
	}

	var request billcommands.MarkPaidRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cmd := billcommands.MarkPaidCommand{
		BillID:  billID,
		Request: request,
		UserID:  shared.UserIDFromString(userID.(string)),
	}

	err := h.markPaidHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to mark as paid",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment marked successfully"})
}