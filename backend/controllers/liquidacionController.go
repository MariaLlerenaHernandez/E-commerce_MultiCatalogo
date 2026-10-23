package controllers

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
)

// LiquidacionController estructura con dependencias inyectadas
type LiquidacionController struct {
	liqRepo interfaces.LiquidacionRepository
}

// NewLiquidacionController crea una nueva instancia con repositorio inyectado
func NewLiquidacionController(liqRepo interfaces.LiquidacionRepository) *LiquidacionController {
	return &LiquidacionController{
		liqRepo: liqRepo,
	}
}

// CrearLiquidacion maneja POST /api/liquidaciones (admin: liquida deudas con distribuidores de forma idempotente)
func (ctrl *LiquidacionController) CrearLiquidacion(c *fiber.Ctx) error {
	var req struct {
		ReferidoID int `json:"referido_id"`
	}
	if err := c.BodyParser(&req); err != nil || req.ReferidoID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "referido_id válido es requerido",
			Details: nil,
		})
	}

	liq, err := ctrl.liqRepo.CrearLiquidacion(req.ReferidoID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: err.Error(),
			Details: nil,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(liq)
}

// GetLiquidaciones maneja GET /api/liquidaciones (admin: historial de todas las liquidaciones)
func (ctrl *LiquidacionController) GetLiquidaciones(c *fiber.Ctx) error {
	liquidaciones, err := ctrl.liqRepo.GetAllLiquidaciones()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener liquidaciones",
			Details: err.Error(),
		})
	}
	return c.JSON(liquidaciones)
}

// GetMisLiquidaciones maneja GET /api/liquidaciones/mias (distribuidor ve sus liquidaciones cobradas)
func (ctrl *LiquidacionController) GetMisLiquidaciones(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(int)
	if !ok || usuarioID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Usuario no identificado en el token",
			Details: nil,
		})
	}

	liquidaciones, err := ctrl.liqRepo.GetLiquidacionesByUsuario(usuarioID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener liquidaciones",
			Details: err.Error(),
		})
	}
	return c.JSON(liquidaciones)
}
