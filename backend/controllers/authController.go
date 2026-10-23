// Declaramos el paquete controllers para agrupar las funciones que manejan la lógica de negocio de las rutas.
package controllers

import (
	// Importamos el framework Fiber para tener acceso al contexto (c *fiber.Ctx) de la petición HTTP.
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"

	// Importamos nuestro paquete de modelos para poder usar la estructura LoginRequest.
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
	"multicatalogo-backend/utils"
)

// AuthController estructura para controlador de autenticación
type AuthController struct {
	userRepo interfaces.UserRepository
}

// NewAuthController crea una nueva instancia
func NewAuthController(userRepo interfaces.UserRepository) *AuthController {
	return &AuthController{
		userRepo: userRepo,
	}
}

// Login es el método controlador que se ejecutará cuando el cliente envíe sus credenciales.
func (ctrl *AuthController) Login(c *fiber.Ctx) error {
	// Creamos una variable 'req' del tipo LoginRequest (ubicada en nuestro paquete models) para almacenar los datos.
	var req models.LoginRequest

	// Intentamos parsear (transformar) el cuerpo JSON entrante y guardarlo en la variable 'req'.
	if err := c.BodyParser(&req); err != nil {
		// Si ocurre un error al parsear (ej. JSON mal formado), retornamos un estado HTTP 400 (Bad Request).
		return c.Status(400).JSON(fiber.Map{"error": "Cuerpo de petición inválido"})
	}
	// Validamos que Email y Password no vengan vacíos antes de evaluar las credenciales.
	emailVacio := strings.TrimSpace(req.Email) == ""
	passwordVacio := strings.TrimSpace(req.Password) == ""
	if emailVacio || passwordVacio {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Email y Password son obligatorios",
			Details: fiber.Map{
				"email_vacio":    emailVacio,
				"password_vacio": passwordVacio,
			},
		})
	}

	// Buscar usuario en el repositorio
	usuario, err := ctrl.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Credenciales incorrectas",
			Details: nil,
		})
	}

	// Verificar password con bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(usuario.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Credenciales incorrectas",
			Details: nil,
		})
	}

	// Generar token JWT real con vigencia de 2h
	token, err := utils.GenerateJWT(usuario)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al generar token de sesión",
			Details: err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"token":  token,
		"email":  usuario.Email,
		"rol":    usuario.Rol,
		"nombre": usuario.Nombre,
	})
}
