package controllers

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
)

// RegisterController estructura con dependencias inyectadas
type RegisterController struct {
	userRepo interfaces.UserRepository
}

// NewRegisterController crea una nueva instancia con inyección de dependencias
func NewRegisterController(userRepo interfaces.UserRepository) *RegisterController {
	return &RegisterController{
		userRepo: userRepo,
	}
}

// Register maneja POST /api/register
func (ctrl *RegisterController) Register(c *fiber.Ctx) error {
	var req models.RegisterRequest

	// Parsear el cuerpo de la petición
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	// Validaciones básicas
	if req.Email == "" || req.Password == "" || req.Nombre == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Email, password y nombre son requeridos",
			Details: nil,
		})
	}

	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El password debe tener al menos 6 caracteres",
			Details: nil,
		})
	}

	// Crear usuario en el repositorio
	err := ctrl.userRepo.Create(req)
	if err != nil {
		// Manejo específico de errores
		if err.Error() == "email ya registrado" {
			return c.Status(fiber.StatusConflict).JSON(models.APIError{
				Status:  fiber.StatusConflict,
				Message: "El email ya está registrado",
				Details: nil,
			})
		}
		if err.Error() == "código de referido inválido" {
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
				Status:  fiber.StatusBadRequest,
				Message: "Código de referido inválido",
				Details: nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al crear usuario",
			Details: err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Usuario registrado exitosamente",
		"email":   req.Email,
	})
}
