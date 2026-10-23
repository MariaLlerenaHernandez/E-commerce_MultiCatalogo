// Declaramos el paquete routes, cuya única responsabilidad es registrar los endpoints de la API.
package routes

import (
	// Importamos Fiber para poder recibir y configurar la instancia principal de la aplicación.
	"github.com/gofiber/fiber/v2"
	// Importamos nuestro paquete de controladores y middlewares.
	"multicatalogo-backend/controllers"
	"multicatalogo-backend/middleware"
)

// SetupRoutes es una función que recibe los controladores instanciados para inyectar las rutas con seguridad RBAC
func SetupRoutes(
	app *fiber.App,
	authCtrl *controllers.AuthController,
	prodCtrl *controllers.ProductController,
	redCtrl *controllers.RedController,
	healthCtrl *controllers.HealthController,
	checkoutCtrl *controllers.CheckoutController,
	registerCtrl *controllers.RegisterController,
	pedidoCtrl *controllers.PedidoController,
	comisionCtrl *controllers.ComisionController,
	liquidacionCtrl *controllers.LiquidacionController,
	reporteCtrl *controllers.ReporteController,
	usuarioCtrl *controllers.UsuarioController,
) {
	// ==========================================
	// 1. RUTAS PÚBLICAS
	// ==========================================
	app.Get("/api/health", healthCtrl.HealthCheck)
	app.Post("/api/login", authCtrl.Login)
	app.Post("/api/register", registerCtrl.Register)
	app.Get("/api/productos", prodCtrl.GetProductos)
	app.Get("/api/productos/:id", prodCtrl.GetProductoPorID)

	// ==========================================
	// 2. RUTAS DE USUARIO AUTENTICADO (RequireAuth)
	// ==========================================
	authGroup := app.Group("/api", middleware.RequireAuth())
	authGroup.Get("/red", redCtrl.GetRed)
	authGroup.Post("/checkout", checkoutCtrl.ProcesarCheckout)
	authGroup.Get("/pedidos/mios", pedidoCtrl.GetMisPedidos)
	authGroup.Get("/comisiones/mias", comisionCtrl.GetMisComisiones)
	authGroup.Get("/liquidaciones/mias", liquidacionCtrl.GetMisLiquidaciones)

	// ==========================================
	// 3. RUTAS EXCLUSIVAS PARA ADMINISTRADOR (RequireAuth + RequireAdmin)
	// ==========================================
	adminGroup := app.Group("/api", middleware.RequireAuth(), middleware.RequireAdmin())

	// CRUD de productos (admin)
	adminGroup.Post("/productos", prodCtrl.CreateProducto)
	adminGroup.Put("/productos/:id", prodCtrl.UpdateProducto)
	adminGroup.Delete("/productos/:id", prodCtrl.DeleteProducto)

	// Endpoints de pedidos (admin)
	adminGroup.Get("/pedidos", pedidoCtrl.GetAllPedidos)
	adminGroup.Get("/pedidos/:id", pedidoCtrl.GetPedidoPorID)
	adminGroup.Patch("/pedidos/:id/estado", pedidoCtrl.UpdateEstadoPedido)

	// Endpoints de liquidaciones (admin)
	adminGroup.Post("/liquidaciones", liquidacionCtrl.CrearLiquidacion)
	adminGroup.Get("/liquidaciones", liquidacionCtrl.GetLiquidaciones)

	// Endpoints de reportes y analítica (admin)
	adminGroup.Get("/reportes/resumen", reporteCtrl.GetResumen)
	adminGroup.Get("/reportes/top-productos", reporteCtrl.GetTopProductos)
	adminGroup.Get("/reportes/top-referidos", reporteCtrl.GetTopReferidos)
	adminGroup.Get("/reportes/comisiones-pendientes", reporteCtrl.GetComisionesPendientes)

	// Endpoints de usuarios/cuentas (admin)
	adminGroup.Get("/usuarios", usuarioCtrl.GetAllUsuarios)
	adminGroup.Patch("/usuarios/:id/estado", usuarioCtrl.UpdateEstadoUsuario)
}
