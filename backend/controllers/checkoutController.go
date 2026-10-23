package controllers

import (
	"fmt"
	"log"
	"time"

	"multicatalogo-backend/domain"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"

	"github.com/gofiber/fiber/v2"
)

// CheckoutController estructura con dependencias inyectadas
type CheckoutController struct {
	orderRepo    interfaces.OrderRepository
	redRepo      interfaces.RedRepository
	cache        interfaces.CacheRepository
	comisionRepo interfaces.ComisionRepository
}

// NewCheckoutController crea una nueva instancia con inyección de dependencias
func NewCheckoutController(
	orderRepo interfaces.OrderRepository,
	redRepo interfaces.RedRepository,
	cache interfaces.CacheRepository,
	comisionRepo interfaces.ComisionRepository,
) *CheckoutController {
	return &CheckoutController{
		orderRepo:    orderRepo,
		redRepo:      redRepo,
		cache:        cache,
		comisionRepo: comisionRepo,
	}
}

// ProcesarCheckout maneja POST /api/checkout con transacción ACID
func (ctrl *CheckoutController) ProcesarCheckout(c *fiber.Ctx) error {
	var req models.CheckoutRequest

	// Parsear el cuerpo de la petición
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
			Details: err.Error(),
		})
	}

	// Validaciones básicas
	// Tomamos la identidad verificada del token JWT (middleware.RequireAuth)
	tokenEmail, _ := c.Locals("email").(string)
	tokenUserID, _ := c.Locals("usuario_id").(int)
	if tokenEmail != "" {
		req.Email = tokenEmail
	}

	if req.Email == "" || req.Nombre == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Email y nombre son requeridos",
			Details: nil,
		})
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El carrito está vacío",
			Details: nil,
		})
	}

	// Calcular total
	total := 0.0
	for _, item := range req.Items {
		total += item.Precio * float64(item.Cantidad)
	}

	// === INICIO DE TRANSACCIÓN ACID ===
	tx, err := ctrl.orderRepo.BeginTransaction()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al iniciar transacción",
			Details: err.Error(),
		})
	}

	// Asegurar Rollback si algo falla (patrón defer)
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("Panic en checkout: %v", r)
		}
	}()

	// Paso 1: Insertar pedido principal vinculado al usuario autenticado
	pedido := models.Pedido{
		UsuarioID:  tokenUserID,
		Email:      req.Email,
		Nombre:     req.Nombre,
		Direccion:  req.Direccion,
		Ciudad:     req.Ciudad,
		Telefono:   req.Telefono,
		MetodoPago: req.MetodoPago,
		Total:      total,
		Items:      req.Items,
		Estado:     "pendiente",
	}

	if err := tx.InsertarPedido(pedido); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al insertar pedido",
			Details: err.Error(),
		})
	}

	// [DEMOSTRACIÓN ACID] Aquí podríamos inyectar un error para demostrar ROLLBACK
	// Uncomment para simular falla en clase:
	// return errors.New("FALLA SIMULADA: Caída del sistema antes de procesar items")

	// Paso 2: Insertar items del pedido (con control de stock)
	if err := tx.InsertarPedidoItems(req.Items); err != nil {
		tx.Rollback()
		status := fiber.StatusBadRequest
		message := "Error al procesar items"

		// Manejo específico de errores
		if err == models.ErrCantidadInvalida {
			message = "La cantidad debe ser mayor que cero"
		} else if err == models.ErrStockInsuficiente {
			message = "Stock insuficiente para uno o más productos"
		}

		return c.Status(status).JSON(models.APIError{
			Status:  status,
			Message: message,
			Details: err.Error(),
		})
	}

	// Paso 3: COMMIT de la transacción
	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al confirmar transacción",
			Details: err.Error(),
		})
	}

	// === FIN DE TRANSACCIÓN ACID ===

	// Si el COMMIT fue exitoso, lanzar Goroutine para calcular comisiones asíncronamente
	go ctrl.calcularComisionesAsync(pedido.ID, tokenUserID, req.Email, total)

	// Invalidar caché de la red del usuario
	cacheKey := "red:tree:" + req.Email
	ctrl.cache.Delete(cacheKey)

	// Retornar respuesta exitosa
	numeroPedido := fmt.Sprintf("MC-%d", time.Now().UnixNano()%1000000)
	return c.Status(fiber.StatusCreated).JSON(models.CheckoutResponse{
		NumeroPedido: numeroPedido,
		Total:        total,
		Fecha:        time.Now().Format("2006-01-02 15:04:05"),
		Estado:       "confirmado",
		Mensaje:      "Pedido procesado exitosamente",
	})
}

// calcularComisionesAsync calcula y registra comisiones en segundo plano usando Goroutine y domain.RepartirComisiones
func (ctrl *CheckoutController) calcularComisionesAsync(pedidoID int, usuarioID int, email string, totalVenta float64) {
	log.Printf("[Goroutine] Iniciando cálculo de comisiones para %s (pedido: %d, venta: $%.2f)", email, pedidoID, totalVenta)

	// Usamos la función pura de dominio
	tasas := map[int]float64{
		1: 0.10, // 10%
		2: 0.05, // 5%
		3: 0.02, // 2%
	}

	comisionesCalculadas := domain.RepartirComisiones(totalVenta, tasas)
	totalComisiones := 0.0

	for _, c := range comisionesCalculadas {
		totalComisiones += c.Monto
		log.Printf("[Goroutine] Comisión nivel %d: $%.2f (%.0f%%)", c.Nivel, c.Monto, c.Porcentaje)

		// Guardar registro de comisión en el ledger
		err := ctrl.comisionRepo.CrearComision(models.Comision{
			PedidoID:   pedidoID,
			ReferidoID: usuarioID,
			Nivel:      c.Nivel,
			Porcentaje: c.Porcentaje,
			Monto:      c.Monto,
			Estado:     "pendiente",
		})
		if err != nil {
			log.Printf("[Goroutine] Error registrando comisión en ledger: %v", err)
		}

		if err := ctrl.redRepo.ActualizarComisiones(email, c.Monto); err != nil {
			log.Printf("[Goroutine] Error actualizando comisiones en red: %v", err)
		}
	}

	log.Printf("[Goroutine] Total comisiones calculadas y registradas: $%.2f para %s", totalComisiones, email)
}
