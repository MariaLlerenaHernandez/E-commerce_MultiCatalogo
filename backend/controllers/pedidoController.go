package controllers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
)

// PedidoController estructura con dependencias inyectadas
type PedidoController struct {
	orderRepo interfaces.OrderRepository
}

// NewPedidoController crea una nueva instancia
func NewPedidoController(orderRepo interfaces.OrderRepository) *PedidoController {
	return &PedidoController{
		orderRepo: orderRepo,
	}
}

// GetMisPedidos maneja GET /api/pedidos/mios (obtiene los pedidos del usuario autenticado)
func (ctrl *PedidoController) GetMisPedidos(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(int)
	if !ok || usuarioID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Usuario no identificado en el token",
			Details: nil,
		})
	}

	pedidos, err := ctrl.orderRepo.GetByUsuario(usuarioID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener pedidos",
			Details: err.Error(),
		})
	}

	return c.JSON(pedidos)
}

// GetAllPedidos maneja GET /api/pedidos (admin)
func (ctrl *PedidoController) GetAllPedidos(c *fiber.Ctx) error {
	pedidos, err := ctrl.orderRepo.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener pedidos",
			Details: err.Error(),
		})
	}

	return c.JSON(pedidos)
}

// GetPedidoPorID maneja GET /api/pedidos/:id
func (ctrl *PedidoController) GetPedidoPorID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID inválido",
			Details: nil,
		})
	}

	pedido, err := ctrl.orderRepo.GetByID(id)
	if err != nil {
		if err == models.ErrNoEncontrado {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status:  fiber.StatusNotFound,
				Message: "Pedido no encontrado",
				Details: nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al obtener pedido",
			Details: err.Error(),
		})
	}

	return c.JSON(pedido)
}

// UpdateEstadoPedido maneja PATCH /api/pedidos/:id/estado (admin) con validación de transiciones
func (ctrl *PedidoController) UpdateEstadoPedido(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID inválido",
			Details: nil,
		})
	}

	var req struct {
		Estado string `json:"estado"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	// Consultar estado actual del pedido
	pedidoActual, err := ctrl.orderRepo.GetByID(id)
	if err != nil {
		if err == models.ErrNoEncontrado {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status:  fiber.StatusNotFound,
				Message: "Pedido no encontrado",
				Details: nil,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al consultar pedido",
			Details: err.Error(),
		})
	}

	// Estados terminales inmutables
	if pedidoActual.Estado == "cancelado" || pedidoActual.Estado == "entregado" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: fmt.Sprintf("No se puede modificar un pedido que ya está en estado terminal '%s'", pedidoActual.Estado),
			Details: nil,
		})
	}

	// Transiciones válidas (máquina de estados finita)
	transicionesValidas := map[string][]string{
		"pendiente":  {"preparando", "cancelado"},
		"preparando": {"enviado", "cancelado"},
		"enviado":    {"entregado", "cancelado"},
	}

	permitido := false
	for _, destino := range transicionesValidas[pedidoActual.Estado] {
		if destino == req.Estado {
			permitido = true
			break
		}
	}

	if !permitido {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: fmt.Sprintf("Transición no permitida: no se puede cambiar de '%s' a '%s'", pedidoActual.Estado, req.Estado),
			Details: nil,
		})
	}

	if err := ctrl.orderRepo.UpdateEstado(id, req.Estado); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al actualizar estado del pedido",
			Details: err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message":       "Estado actualizado exitosamente",
		"id":            id,
		"estado_anterior": pedidoActual.Estado,
		"nuevo_estado":  req.Estado,
	})
}
