package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
	"multicatalogo-backend/utils"
)

// RequireAuth valida que la petición incluya una cabecera Authorization válida con formato Bearer <token>
func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Acceso no autorizado: se requiere token de autenticación",
				Details: nil,
			})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Formato de autorización inválido. Use 'Bearer <token>'",
				Details: nil,
			})
		}

		claims, err := utils.ValidateJWT(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Token inválido o expirado",
				Details: err.Error(),
			})
		}

		// Almacenamos los datos del usuario en el contexto local de Fiber para los controladores
		c.Locals("usuario_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("rol", claims.Rol)
		c.Locals("nombre", claims.Nombre)

		return c.Next()
	}
}

// RequireAdmin valida que el usuario autenticado cuente con el rol 'admin'
func RequireAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		rol, ok := c.Locals("rol").(string)
		if !ok || rol != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{
				Status:  fiber.StatusForbidden,
				Message: "Acceso denegado: se requieren permisos de administrador",
				Details: nil,
			})
		}
		return c.Next()
	}
}
