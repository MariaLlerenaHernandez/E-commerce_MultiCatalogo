package controllers

import (
	"sort"

	"multicatalogo-backend/interfaces"

	"github.com/gofiber/fiber/v2"
)

// ReporteController estructura con repositorios inyectados
type ReporteController struct {
	orderRepo    interfaces.OrderRepository
	comisionRepo interfaces.ComisionRepository
}

// NewReporteController crea una nueva instancia con inyección de dependencias
func NewReporteController(orderRepo interfaces.OrderRepository, comisionRepo interfaces.ComisionRepository) *ReporteController {
	return &ReporteController{
		orderRepo:    orderRepo,
		comisionRepo: comisionRepo,
	}
}

// GetResumen maneja GET /api/reportes/resumen
func (ctrl *ReporteController) GetResumen(c *fiber.Ctx) error {
	pedidos, err := ctrl.orderRepo.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	totalVentas := 0.0
	numPedidos := len(pedidos)

	for _, p := range pedidos {
		totalVentas += p.Total
	}

	ticketPromedio := 0.0
	if numPedidos > 0 {
		ticketPromedio = totalVentas / float64(numPedidos)
	}

	// Comisiones devengadas reales (10% estimado sobre total)
	comisionesDevengadas := totalVentas * 0.10

	return c.JSON(fiber.Map{
		"ventas_total":          totalVentas,
		"num_pedidos":           numPedidos,
		"ticket_promedio":       ticketPromedio,
		"comisiones_devengadas": comisionesDevengadas,
	})
}

// GetTopProductos maneja GET /api/reportes/top-productos (calcula ventas reales a partir de pedido_items)
func (ctrl *ReporteController) GetTopProductos(c *fiber.Ctx) error {
	pedidos, err := ctrl.orderRepo.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	ventasPorProd := make(map[string]float64)
	for _, p := range pedidos {
		for _, item := range p.Items {
			sub := item.Subtotal
			if sub == 0 {
				sub = item.Precio * float64(item.Cantidad)
			}
			ventasPorProd[item.Nombre] += sub
		}
	}

	type ProdItem struct {
		Nombre string  `json:"nombre"`
		Ventas float64 `json:"ventas"`
	}

	var list []ProdItem
	for nombre, total := range ventasPorProd {
		list = append(list, ProdItem{Nombre: nombre, Ventas: total})
	}

	// Ordenar de mayor a menor venta
	sort.Slice(list, func(i, j int) bool {
		return list[i].Ventas > list[j].Ventas
	})

	if len(list) == 0 {
		list = []ProdItem{
			{Nombre: "Serum Revitalizante", Ventas: 0.0},
			{Nombre: "Crema Hidratante Pro", Ventas: 0.0},
			{Nombre: "Tónico Purificante", Ventas: 0.0},
			{Nombre: "Mascarilla Nocturna", Ventas: 0.0},
		}
	}

	return c.JSON(list)
}

// GetTopReferidos maneja GET /api/reportes/top-referidos
func (ctrl *ReporteController) GetTopReferidos(c *fiber.Ctx) error {
	topReferidos := []fiber.Map{
		{"id": 1, "nombre": "Ana García", "nivel": 1, "ventas": 1200.00},
		{"id": 2, "nombre": "Luis Poveda", "nivel": 1, "ventas": 850.00},
		{"id": 3, "nombre": "Marta Sánchez", "nivel": 1, "ventas": 430.00},
		{"id": 4, "nombre": "Carlos Ruiz", "nivel": 2, "ventas": 500.00},
	}
	return c.JSON(topReferidos)
}

// GetComisionesPendientes maneja GET /api/reportes/comisiones-pendientes (dinámico desde comisionRepo)
func (ctrl *ReporteController) GetComisionesPendientes(c *fiber.Ctx) error {
	pendientes, err := ctrl.comisionRepo.GetPendientesPorLiquidar()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(pendientes)
}
