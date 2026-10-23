package controllers

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
)

// ComisionController estructura con dependencias inyectadas
type ComisionController struct {
	comisionRepo interfaces.ComisionRepository
}

// NewComisionController crea una nueva instancia con repositorio inyectado
func NewComisionController(comisionRepo interfaces.ComisionRepository) *ComisionController {
	return &ComisionController{
		comisionRepo: comisionRepo,
	}
}

// GetMisComisiones maneja GET /api/comisiones/mias (para el usuario autenticado)
func (ctrl *ComisionController) GetMisComisiones(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(int)
	if !ok || usuarioID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Usuario no identificado en el token",
			Details: nil,
		})
	}

	comisiones, totalPendiente, totalPagada, err := ctrl.comisionRepo.GetComisionesByUsuario(usuarioID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener comisiones",
			Details: err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"comisiones":      comisiones,
		"total_pendiente": totalPendiente,
		"total_pagada":    totalPagada,
	})
}
