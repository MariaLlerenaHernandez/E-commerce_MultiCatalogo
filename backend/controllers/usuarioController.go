package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
)

// UsuarioController maneja la administración de cuentas y usuarios
type UsuarioController struct {
	userRepo interfaces.UserRepository
}

// NewUsuarioController crea una nueva instancia de UsuarioController
func NewUsuarioController(userRepo interfaces.UserRepository) *UsuarioController {
	return &UsuarioController{
		userRepo: userRepo,
	}
}

// GetAllUsuarios retorna la lista completa de usuarios (admin)
func (ctrl *UsuarioController) GetAllUsuarios(c *fiber.Ctx) error {
	usuarios, err := ctrl.userRepo.GetAllUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener usuarios",
			Details: err.Error(),
		})
	}

	return c.JSON(usuarios)
}

// UpdateEstadoUsuario activa o desactiva la cuenta de un usuario
func (ctrl *UsuarioController) UpdateEstadoUsuario(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID de usuario inválido",
		})
	}

	var body struct {
		Activo bool `json:"activo"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	if err := ctrl.userRepo.UpdateEstadoUsuario(id, body.Activo); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al actualizar estado del usuario",
			Details: err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"mensaje": "Estado de usuario actualizado correctamente",
		"id":      id,
		"activo":  body.Activo,
	})
}
