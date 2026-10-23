package controllers

import (
	"multicatalogo-backend/config"

	"github.com/gofiber/fiber/v2"
)

// HealthController estructura para controlador de health
type HealthController struct{}

// NewHealthController crea una nueva instancia
func NewHealthController() *HealthController {
	return &HealthController{}
}

// HealthCheck confirma que el servidor está operativo y verifica dependencias.
func (ctrl *HealthController) HealthCheck(c *fiber.Ctx) error {
	status := fiber.Map{
		"status":  "ok",
		"message": "Servidor Go/Fiber operativo",
		"dependencies": fiber.Map{
			"redis":    "ok",
			"postgres": "ok",
		},
	}

	degraded := false

	// Verificar Redis
	if !config.RedisAvailable {
		status["dependencies"].(fiber.Map)["redis"] = "unavailable"
		degraded = true
	}

	// Verificar PostgreSQL
	if !config.PostgresAvailable {
		status["dependencies"].(fiber.Map)["postgres"] = "unavailable"
		degraded = true
	}

	if degraded {
		status["status"] = "degraded"
		status["message"] = "Servidor operativo pero algunas dependencias no disponibles"
	}

	return c.Status(fiber.StatusOK).JSON(status)
}
