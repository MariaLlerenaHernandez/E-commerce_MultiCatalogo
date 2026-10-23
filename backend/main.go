// Declaramos que este es el paquete principal (main), es decir, el archivo ejecutable que inicia el programa.
package main

import (
	// Importamos el framework principal Fiber.
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	// Importamos el middleware CORS para gestionar la seguridad entre distintos puertos/dominios.
	"github.com/gofiber/fiber/v2/middleware/cors"
	// Importamos nuestro propio paquete de rutas para delegarle la configuración de los endpoints.
	"multicatalogo-backend/config"
	"multicatalogo-backend/controllers"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/routes"
)

// func main es el punto de entrada de la aplicación en Go. Todo comienza a ejecutarse aquí.
func main() {
	// Inicializamos la conexión a Redis.
	config.InitRedis()

	// Inicializamos la conexión a PostgreSQL.
	config.InitPostgres()

	// === INYECCIÓN DE DEPENDENCIAS ===
	// Creamos las instancias de repositorios
	// Usar PostgreSQL si está disponible, sino fallback a memoria
	var productRepo interfaces.ProductRepository
	var orderRepo interfaces.OrderRepository
	var redRepo interfaces.RedRepository
	var userRepo interfaces.UserRepository
	var comisionRepo interfaces.ComisionRepository
	var liquidacionRepo interfaces.LiquidacionRepository

	if config.PostgresAvailable {
		pgRepo := repository.NewPostgresRepository()
		productRepo = pgRepo
		orderRepo = pgRepo
		redRepo = pgRepo
		comisionRepo = pgRepo
		liquidacionRepo = pgRepo
		userRepo = repository.NewPostgresUserRepository()
		if userRepo == nil {
			userRepo = repository.NewMemoryRepository()
		}
		log.Println("🐘 Conectado y utilizando PostgreSQL como fuente de datos principal")
	} else {
		memoryRepo := repository.NewMemoryRepository()
		productRepo = memoryRepo
		orderRepo = memoryRepo
		redRepo = memoryRepo
		comisionRepo = memoryRepo
		liquidacionRepo = memoryRepo
		userRepo = memoryRepo
		log.Println("💾 Usando repositorio en memoria (PostgreSQL no disponible)")
	}

	cacheRepo := repository.NewRedisCache()

	// Creamos los controladores con sus dependencias inyectadas
	authCtrl := controllers.NewAuthController(userRepo)
	healthCtrl := controllers.NewHealthController()
	prodCtrl := controllers.NewProductController(productRepo, cacheRepo)
	redCtrl := controllers.NewRedController(redRepo, cacheRepo)
	checkoutCtrl := controllers.NewCheckoutController(orderRepo, redRepo, cacheRepo, comisionRepo)
	registerCtrl := controllers.NewRegisterController(userRepo)
	pedidoCtrl := controllers.NewPedidoController(orderRepo)
	comisionCtrl := controllers.NewComisionController(comisionRepo)
	liquidacionCtrl := controllers.NewLiquidacionController(liquidacionRepo)
	reporteCtrl := controllers.NewReporteController(orderRepo, comisionRepo)
	usuarioCtrl := controllers.NewUsuarioController(userRepo)

	// Instanciamos una nueva aplicación de Fiber y la guardamos en la variable 'app'.
	app := fiber.New()

	// Implementamos el middleware CORS a nivel global usando app.Use() para interceptar todas las peticiones entrantes.
	corsOrigins := os.Getenv("CORS_ORIGIN")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:5173, http://192.168.1.102:5173, http://127.0.0.1:5173, https://*.onrender.com"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Llamamos a la función SetupRoutes de nuestro paquete 'routes', enviándole los controladores instanciados.
	routes.SetupRoutes(app, authCtrl, prodCtrl, redCtrl, healthCtrl, checkoutCtrl, registerCtrl, pedidoCtrl, comisionCtrl, liquidacionCtrl, reporteCtrl, usuarioCtrl)

	// Servir el frontend compilado (PWA) si existe dist (para despliegue unificado o producción)
	distPath := "./dist"
	if _, err := os.Stat(distPath); os.IsNotExist(err) {
		distPath = "../dist"
	}
	if _, err := os.Stat(distPath); err == nil {
		app.Static("/", distPath)
		app.Get("*", func(c *fiber.Ctx) error {
			if !strings.HasPrefix(c.Path(), "/api") {
				return c.SendFile(distPath + "/index.html")
			}
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Ruta de API no encontrada"})
		})
	}

	// Configurar puerto desde variable de entorno (defecto 3000)
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Ponemos a la aplicación a escuchar peticiones en el puerto configurado.
	app.Listen(":" + port)
}
