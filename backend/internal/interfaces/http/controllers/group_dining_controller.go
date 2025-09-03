package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chun-wei0413/pingnom/internal/application/groupdining/dtos"
	"github.com/chun-wei0413/pingnom/internal/application/groupdining/services"
)

type GroupDiningController struct {
	groupDiningService *services.GroupDiningService
}

func NewGroupDiningController(groupDiningService *services.GroupDiningService) *GroupDiningController {
	return &GroupDiningController{
		groupDiningService: groupDiningService,
	}
}

func (c *GroupDiningController) CreateGroupDiningPlan(ctx *gin.Context) {
	var req dtos.CreateGroupDiningPlanRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := c.groupDiningService.CreateGroupDiningPlan(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, response)
}

func (c *GroupDiningController) GetGroupDiningPlan(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	response, err := c.groupDiningService.GetGroupDiningPlanByID(planID)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) GetGroupDiningPlansByCreator(ctx *gin.Context) {
	createdBy := ctx.Query("created_by")
	if createdBy == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "created_by parameter is required"})
		return
	}

	responses, err := c.groupDiningService.GetGroupDiningPlansByCreator(createdBy)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"plans": responses})
}

func (c *GroupDiningController) GetGroupDiningPlansByParticipant(ctx *gin.Context) {
	userID := ctx.Query("user_id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user_id parameter is required"})
		return
	}

	responses, err := c.groupDiningService.GetGroupDiningPlansByParticipant(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"plans": responses})
}

func (c *GroupDiningController) AddTimeSlot(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		StartTime   time.Time `json:"start_time" binding:"required"`
		EndTime     time.Time `json:"end_time" binding:"required"`
		Description string    `json:"description"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.AddTimeSlotRequest{
		PlanID:      planID,
		StartTime:   reqBody.StartTime,
		EndTime:     reqBody.EndTime,
		Description: reqBody.Description,
	}

	response, err := c.groupDiningService.AddTimeSlot(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) AddRestaurantOption(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		Name        string  `json:"name" binding:"required"`
		Address     string  `json:"address"`
		Latitude    float64 `json:"latitude"`
		Longitude   float64 `json:"longitude"`
		CuisineType string  `json:"cuisine_type"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.AddRestaurantOptionRequest{
		PlanID:      planID,
		Name:        reqBody.Name,
		Address:     reqBody.Address,
		Latitude:    reqBody.Latitude,
		Longitude:   reqBody.Longitude,
		CuisineType: reqBody.CuisineType,
	}

	response, err := c.groupDiningService.AddRestaurantOption(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) JoinGroupDiningPlan(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		UserID      string `json:"user_id" binding:"required"`
		DisplayName string `json:"display_name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.JoinGroupDiningPlanRequest{
		PlanID:      planID,
		UserID:      reqBody.UserID,
		DisplayName: reqBody.DisplayName,
	}

	response, err := c.groupDiningService.JoinGroupDiningPlan(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) StartVoting(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		VotingDeadline *time.Time `json:"voting_deadline"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.StartVotingRequest{
		PlanID:         planID,
		VotingDeadline: reqBody.VotingDeadline,
	}

	response, err := c.groupDiningService.StartVoting(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) SubmitVote(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		UserID        string   `json:"user_id" binding:"required"`
		TimeSlotIDs   []string `json:"time_slot_ids" binding:"required"`
		RestaurantIDs []string `json:"restaurant_ids" binding:"required"`
		Comment       string   `json:"comment"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.SubmitVoteRequest{
		PlanID:        planID,
		UserID:        reqBody.UserID,
		TimeSlotIDs:   reqBody.TimeSlotIDs,
		RestaurantIDs: reqBody.RestaurantIDs,
		Comment:       reqBody.Comment,
	}

	response, err := c.groupDiningService.SubmitVote(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) FinalizeGroupDiningPlan(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	var reqBody struct {
		TimeSlotID   string `json:"time_slot_id" binding:"required"`
		RestaurantID string `json:"restaurant_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &dtos.FinalizeGroupDiningPlanRequest{
		PlanID:       planID,
		TimeSlotID:   reqBody.TimeSlotID,
		RestaurantID: reqBody.RestaurantID,
	}

	response, err := c.groupDiningService.FinalizeGroupDiningPlan(req)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *GroupDiningController) GetVotingResults(ctx *gin.Context) {
	planID := ctx.Param("id")
	if planID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "plan ID is required"})
		return
	}

	response, err := c.groupDiningService.GetVotingResults(planID)
	if err != nil {
		if err.Error() == "group dining plan not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}