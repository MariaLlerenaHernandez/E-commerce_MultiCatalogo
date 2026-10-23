// Seguimos dentro del paquete controllers, ya que maneja la lógica de otra sección del negocio.
package controllers

import (
	"encoding/json"
	"strconv"

	// Importamos Fiber para manejar la respuesta HTTP.
	"github.com/gofiber/fiber/v2"
	// Importamos nuestro paquete de modelos para usar la estructura Producto.

	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
	// Importamos interfaces para inyección de dependencias.
)

// ProductController estructura con dependencias inyectadas
type ProductController struct {
	productRepo interfaces.ProductRepository
	cache       interfaces.CacheRepository
}

// NewProductController crea una nueva instancia con inyección de dependencias
func NewProductController(productRepo interfaces.ProductRepository, cache interfaces.CacheRepository) *ProductController {
	return &ProductController{
		productRepo: productRepo,
		cache:       cache,
	}
}

// GetProductos es el método controlador encargado de devolver el catálogo de artículos.
// Implementa el patrón Cache-Aside para optimizar consultas repetitivas.
func (ctrl *ProductController) GetProductos(c *fiber.Ctx) error {
	// Intentamos obtener los productos desde Redis (Cache Hit).
	cachedData, err := ctrl.cache.Get("productos:all")
	if err == nil {
		// Cache Hit: deserializamos el JSON y retornamos inmediatamente.
		var productos []models.Producto
		if err := json.Unmarshal([]byte(cachedData), &productos); err == nil {
			return c.JSON(productos)
		}
	}

	// Cache Miss: consultamos los datos desde el repositorio.
	productos, err := ctrl.productRepo.GetAllProducts()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener productos",
			Details: err.Error(),
		})
	}

	// Serializamos a JSON para guardar en caché.
	jsonData, err := json.Marshal(productos)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al serializar productos",
			Details: nil,
		})
	}

	// Guardamos en Redis con TTL de 5 minutos (300 segundos).
	ctrl.cache.Set("productos:all", string(jsonData), 300)

	// Retornamos la respuesta.
	return c.JSON(productos)
}

// GetProductoPorID devuelve un producto según el ID recibido en la URL.
func (ctrl *ProductController) GetProductoPorID(c *fiber.Ctx) error {
	// Convertimos el parámetro a entero; si el usuario envía texto devolvemos un APIError 400.
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El ID debe ser un número entero",
			Details: c.Params("id"),
		})
	}

	// Consultamos el producto desde el repositorio.
	producto, err := ctrl.productRepo.GetProductByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{
			Status:  fiber.StatusNotFound,
			Message: "Producto no encontrado",
			Details: id,
		})
	}

	return c.JSON(producto)
}

// CreateProducto maneja POST /api/productos (admin)
func (ctrl *ProductController) CreateProducto(c *fiber.Ctx) error {
	var producto models.Producto
	if err := c.BodyParser(&producto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	if producto.Nombre == "" || producto.Precio <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Nombre y precio válido son requeridos",
			Details: nil,
		})
	}

	if err := ctrl.productRepo.CreateProduct(producto); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al crear producto",
			Details: err.Error(),
		})
	}

	// Invalidar caché
	ctrl.cache.Delete("productos:all")

	return c.Status(fiber.StatusCreated).JSON(producto)
}

// UpdateProducto maneja PUT /api/productos/:id (admin)
func (ctrl *ProductController) UpdateProducto(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID inválido",
			Details: nil,
		})
	}

	var producto models.Producto
	if err := c.BodyParser(&producto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	producto.ID = id
	if err := ctrl.productRepo.UpdateProduct(id, producto); err != nil {
		if err == models.ErrNoEncontrado {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status:  fiber.StatusNotFound,
				Message: "Producto no encontrado",
				Details: nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al actualizar producto",
			Details: err.Error(),
		})
	}

	// Invalidar caché
	ctrl.cache.Delete("productos:all")

	return c.JSON(producto)
}

// DeleteProducto maneja DELETE /api/productos/:id (admin)
func (ctrl *ProductController) DeleteProducto(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID inválido",
			Details: nil,
		})
	}

	if err := ctrl.productRepo.DeleteProduct(id); err != nil {
		if err == models.ErrNoEncontrado {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status:  fiber.StatusNotFound,
				Message: "Producto no encontrado",
				Details: nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al desactivar producto",
			Details: err.Error(),
		})
	}

	// Invalidar caché
	ctrl.cache.Delete("productos:all")

	return c.JSON(fiber.Map{"message": "Producto desactivado"})
}
