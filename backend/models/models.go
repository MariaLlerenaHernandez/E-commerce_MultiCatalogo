// Declaramos el paquete models para agrupar las estructuras de datos de la aplicación.
package models

import (
	"errors"
)

// LoginRequest define la estructura esperada para el cuerpo de la petición (JSON) al iniciar sesión.
type LoginRequest struct {
	// Email representa el correo del usuario; la etiqueta `json:"email"` indica cómo se mapea el JSON a esta variable.
	Email string `json:"email"`
	// Password representa la contraseña del usuario; se extrae del campo "password" del JSON entrante.
	Password string `json:"password"`
}

// RegisterRequest define la estructura para registro de nuevos usuarios
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Nombre   string `json:"nombre"`
	Ref      string `json:"ref,omitempty"` // Código de referido opcional
}

// Producto define la estructura de los datos de un artículo en nuestro catálogo.
type Producto struct {
	// ID es el identificador único numérico del producto.
	ID int `json:"id"`
	// Nombre es la descripción en texto del producto.
	Nombre string `json:"nombre"`
	// Descripción del producto.
	Descripcion string `json:"descripcion,omitempty"`
	// Precio es el costo del producto, almacenado como un número con decimales (float64).
	Precio float64 `json:"precio"`
	// Stock disponible.
	Stock int `json:"stock"`
	// Categoría del producto.
	Categoria string `json:"categoria,omitempty"`
	// Img es la URL o ruta que apunta a la fotografía o imagen del producto.
	Img string `json:"img"`
	// Activo indica si el producto está disponible (borrado lógico).
	Activo bool `json:"activo"`
}

// APIError estandariza los errores HTTP de la API
type APIError struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Errores personalizados
var (
	ErrNoEncontrado      = errors.New("recurso no encontrado")
	ErrCantidadInvalida  = errors.New("cantidad debe ser mayor que cero")
	ErrStockInsuficiente = errors.New("stock insuficiente")
)

// Referido representa un nodo en la red multinivel de referidos
type Referido struct {
	ID     int        `json:"id"`
	Nombre string     `json:"nombre"`
	Nivel  int        `json:"nivel"`
	Ventas float64    `json:"ventas"`
	Hijos  []Referido `json:"hijos,omitempty"`
}

// PedidoItem representa un ítem en el detalle de un pedido
type PedidoItem struct {
	ID         int     `json:"id,omitempty"`
	PedidoID   int     `json:"pedido_id,omitempty"`
	ProductoID int     `json:"producto_id"`
	Nombre     string  `json:"nombre"`
	Cantidad   int     `json:"cantidad"`
	Precio     float64 `json:"precio"`
	Subtotal   float64 `json:"subtotal"`
}

// Pedido representa un pedido de compra
type Pedido struct {
	ID         int          `json:"id"`
	Numero     string       `json:"numero"`
	UsuarioID  int          `json:"usuario_id,omitempty"`
	Email      string       `json:"email"`
	Nombre     string       `json:"nombre"`
	Direccion  string       `json:"direccion"`
	Ciudad     string       `json:"ciudad"`
	Telefono   string       `json:"telefono"`
	MetodoPago string       `json:"metodo_pago"`
	Total      float64      `json:"total"`
	Items      []PedidoItem `json:"items"`
	Fecha      string       `json:"fecha"`
	Estado     string       `json:"estado"`
}

// CheckoutRequest representa el cuerpo de la petición para procesar un checkout
type CheckoutRequest struct {
	Email      string       `json:"email"`
	Nombre     string       `json:"nombre"`
	Direccion  string       `json:"direccion"`
	Ciudad     string       `json:"ciudad"`
	Telefono   string       `json:"telefono"`
	MetodoPago string       `json:"metodo_pago"`
	Items      []PedidoItem `json:"items"`
}

// CheckoutResponse representa la respuesta exitosa de un checkout
type CheckoutResponse struct {
	NumeroPedido string  `json:"numero_pedido"`
	Total        float64 `json:"total"`
	Fecha        string  `json:"fecha"`
	Estado       string  `json:"estado"`
	Mensaje      string  `json:"mensaje"`
}

// Usuario representa un usuario del sistema
type Usuario struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	Password   string `json:"-"` // No se serializa en JSON
	Nombre     string `json:"nombre"`
	Rol        string `json:"rol"`
	Activo     bool   `json:"activo"`
	ReferidoID *int   `json:"referido_id,omitempty"`
	CreadoEn   string `json:"creado_en,omitempty"`
}

// Comision representa un registro en el ledger de comisiones
type Comision struct {
	ID            int     `json:"id"`
	PedidoID      int     `json:"pedido_id"`
	ReferidoID    int     `json:"referido_id"`
	Nivel         int     `json:"nivel"`
	Porcentaje    float64 `json:"porcentaje"`
	Monto         float64 `json:"monto"`
	Estado        string  `json:"estado"` // 'pendiente', 'pagada', 'revertida'
	LiquidacionID *int    `json:"liquidacion_id,omitempty"`
	CreadoEn      string  `json:"creado_en,omitempty"`
}

// Liquidacion representa un pago consolidado a un distribuidor
type Liquidacion struct {
	ID             int     `json:"id"`
	ReferidoID     int     `json:"referido_id"`
	ReferidoNombre string  `json:"referido_nombre,omitempty"`
	ReferidoEmail  string  `json:"referido_email,omitempty"`
	Total          float64 `json:"total"`
	Estado         string  `json:"estado"` // 'pendiente', 'pagada'
	CreadoEn       string  `json:"creado_en,omitempty"`
	PagadaEn       *string `json:"pagada_en,omitempty"`
}
