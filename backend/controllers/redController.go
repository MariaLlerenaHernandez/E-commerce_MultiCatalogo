package controllers

import (
	"encoding/json"

	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"

	"github.com/gofiber/fiber/v2"
)

// RedController estructura con dependencias inyectadas
type RedController struct {
	redRepo interfaces.RedRepository
	cache   interfaces.CacheRepository
}

// NewRedController crea una nueva instancia con inyección de dependencias
func NewRedController(redRepo interfaces.RedRepository, cache interfaces.CacheRepository) *RedController {
	return &RedController{
		redRepo: redRepo,
		cache:   cache,
	}
}

// GetRed devuelve la jerarquía de referidos del usuario autenticado.
// Implementa el patrón Cache-Aside para optimizar esta operación costosa (cálculo recursivo).
func (ctrl *RedController) GetRed(c *fiber.Ctx) error {
	// Obtenemos el email del usuario autenticado desde el token JWT (c.Locals)
	email, _ := c.Locals("email").(string)
	if email == "" {
		email = c.Query("email")
	}
	if email == "" {
		email = "cliente@upse.edu.ec"
	}

	// Clave de caché: red:tree:{email_usuario}
	cacheKey := "red:tree:" + email

	// Intentamos obtener la red desde Redis (Cache Hit).
	cachedData, err := ctrl.cache.Get(cacheKey)
	if err == nil {
		// Cache Hit: deserializamos el JSON y retornamos inmediatamente.
		var red models.Referido
		if err := json.Unmarshal([]byte(cachedData), &red); err == nil {
			return c.JSON(red)
		}
	}

	// Cache Miss: construimos el árbol desde los datos (simulación de PostgreSQL).
	red, err := ctrl.redRepo.GetByEmail(email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener red",
			Details: err.Error(),
		})
	}

	// Serializamos a JSON para guardar en caché.
	jsonData, err := json.Marshal(red)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al serializar red",
			Details: nil,
		})
	}

	// Guardamos en Redis con TTL de 10 minutos (600 segundos).
	ctrl.cache.Set(cacheKey, string(jsonData), 600)

	// Retornamos la respuesta.
	return c.JSON(red)
}
