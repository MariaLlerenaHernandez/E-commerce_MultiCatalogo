package interfaces

import (
	"multicatalogo-backend/models"
)

// ProductRepository define la interfaz para operaciones de productos
type ProductRepository interface {
	GetAllProducts() ([]models.Producto, error)
	GetProductByID(id int) (*models.Producto, error)
	CreateProduct(producto models.Producto) error
	UpdateProduct(id int, producto models.Producto) error
	DeleteProduct(id int) error
}

// UserRepository define la interfaz para operaciones de usuarios
type UserRepository interface {
	Create(req models.RegisterRequest) error
	GetUserByEmail(email string) (*models.Usuario, error)
	GetUserByID(id int) (*models.Usuario, error)
	GetAllUsers() ([]models.Usuario, error)
	UpdateEstadoUsuario(id int, activo bool) error
}

// RedRepository define la interfaz para operaciones de la red multinivel
type RedRepository interface {
	GetByEmail(email string) (*models.Referido, error)
	ActualizarComisiones(email string, comision float64) error
	// GetByUserID(userID int) (*models.Referido, error) // TODO: Implementar cuando sea necesario
}

// OrderRepository define la interfaz para operaciones de pedidos con transacciones
type OrderRepository interface {
	BeginTransaction() (Transaction, error)
	GetByUsuario(usuarioID int) ([]models.Pedido, error)
	GetAll() ([]models.Pedido, error)
	GetByID(id int) (*models.Pedido, error)
	UpdateEstado(id int, estado string) error
}

// Transaction define la interfaz para manejar transacciones ACID
type Transaction interface {
	InsertarPedido(pedido *models.Pedido) error
	InsertarPedidoItems(items []models.PedidoItem) error
	Commit() error
	Rollback() error
}

// CacheRepository define la interfaz para operaciones de caché
type CacheRepository interface {
	Get(key string) (string, error)
	Set(key string, value string, ttl int) error
	Delete(key string) error
}

// ComisionRepository define la interfaz para comisiones y ledger
type ComisionRepository interface {
	CrearComision(c models.Comision) error
	GetComisionesByUsuario(usuarioID int) ([]models.Comision, float64, float64, error)
	GetPendientesPorLiquidar() ([]map[string]interface{}, error)
}

// LiquidacionRepository define la interfaz para liquidaciones de comisiones
type LiquidacionRepository interface {
	CrearLiquidacion(referidoID int) (*models.Liquidacion, error)
	GetAllLiquidaciones() ([]models.Liquidacion, error)
	GetLiquidacionesByUsuario(usuarioID int) ([]models.Liquidacion, error)
}
