package repository

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
	"multicatalogo-backend/utils"

	"golang.org/x/crypto/bcrypt"
)

// MemoryTransaction implementa la interfaz Transaction para simular transacciones ACID en memoria
type MemoryTransaction struct {
	committed      bool
	rolledBack     bool
	pedidoGuardado *models.Pedido
	itemsGuardados []models.PedidoItem
	pedidos        *[]models.Pedido
	items          *[]models.PedidoItem
	mu             *sync.Mutex
}

// InsertarPedido simula la inserción del pedido principal
func (tx *MemoryTransaction) InsertarPedido(pedido *models.Pedido) error {
	if tx.committed || tx.rolledBack {
		return errors.New("transacción ya finalizada")
	}
	tx.pedidoGuardado = pedido
	return nil
}

// InsertarPedidoItems simula la inserción de los items del pedido con control de stock
func (tx *MemoryTransaction) InsertarPedidoItems(items []models.PedidoItem) error {
	if tx.committed || tx.rolledBack {
		return errors.New("transacción ya finalizada")
	}

	// Simulación de control de stock
	for _, item := range items {
		if item.Cantidad <= 0 {
			return models.ErrCantidadInvalida
		}
		if item.Cantidad > 100 {
			return models.ErrStockInsuficiente
		}
	}

	tx.itemsGuardados = items
	return nil
}

// Commit confirma la transacción (simula COMMIT en PostgreSQL)
func (tx *MemoryTransaction) Commit() error {
	if tx.committed || tx.rolledBack {
		return errors.New("transacción ya finalizada")
	}

	tx.mu.Lock()
	defer tx.mu.Unlock()

	// Generar ID y número de pedido
	pedidoID := len(*tx.pedidos) + 1
	tx.pedidoGuardado.ID = pedidoID
	tx.pedidoGuardado.Numero = fmt.Sprintf("MC-%d", time.Now().UnixNano()%1000000)
	tx.pedidoGuardado.Fecha = time.Now().Format("2006-01-02 15:04:05")
	tx.pedidoGuardado.Estado = "confirmado"

	// Guardar pedido
	*tx.pedidos = append(*tx.pedidos, *tx.pedidoGuardado)

	// Guardar items con IDs
	for i := range tx.itemsGuardados {
		tx.itemsGuardados[i].Subtotal = tx.itemsGuardados[i].Precio * float64(tx.itemsGuardados[i].Cantidad)
	}
	*tx.items = append(*tx.items, tx.itemsGuardados...)

	tx.committed = true
	return nil
}

// Rollback revierte la transacción (simula ROLLBACK en PostgreSQL)
func (tx *MemoryTransaction) Rollback() error {
	if tx.committed || tx.rolledBack {
		return errors.New("transacción ya finalizada")
	}

	tx.mu.Lock()
	defer tx.mu.Unlock()

	// En memoria, simplemente descartamos los datos no confirmados
	tx.pedidoGuardado = nil
	tx.itemsGuardados = nil
	tx.rolledBack = true
	return nil
}

// MemoryRepository implementa las interfaces de repositorio en memoria
type MemoryRepository struct {
	pedidos       []models.Pedido
	items         []models.PedidoItem
	productos     []models.Producto
	red           models.Referido
	usuarios      []models.Usuario
	comisiones    []models.Comision
	liquidaciones []models.Liquidacion
	mu            sync.Mutex
}

// NewMemoryRepository crea una nueva instancia del repositorio en memoria
func NewMemoryRepository() *MemoryRepository {
	// Generar passwords hasheados para usuarios de prueba
	adminPass, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	clientePass, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	liqIDDemo := 1

	return &MemoryRepository{
		productos: []models.Producto{
			{ID: 1, Nombre: "Serum Revitalizante", Descripcion: "Fórmula concentrada con ácido hialurónico y vitamina C para revitalizar tu piel.", Precio: 45.00, Stock: 97, Categoria: "Facial", Img: "https://images.unsplash.com/photo-1617897903246-719242758050?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 2, Nombre: "Crema Hidratante Pro", Descripcion: "Hidratación profunda 24h para todo tipo de piel.", Precio: 32.50, Stock: 100, Categoria: "Cuidado Diario", Img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 3, Nombre: "Tónico Purificante", Descripcion: "Equilibra el pH y minimiza los poros suavemente.", Precio: 28.00, Stock: 100, Categoria: "Limpieza", Img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 4, Nombre: "Mascarilla Nocturna", Descripcion: "Nutrición intensiva durante el sueño con extractos botánicos.", Precio: 50.00, Stock: 100, Categoria: "Tratamiento", Img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 5, Nombre: "Agua Micelar Botánica", Descripcion: "Limpiador suave con extracto de manzanilla silvestre y aloe vera para calmar e hidratar.", Precio: 24.00, Stock: 85, Categoria: "Limpieza", Img: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 6, Nombre: "Exfoliante Facial de Bambú", Descripcion: "Micropartículas naturales de bambú y té verde para renovar la textura de la piel suavemente.", Precio: 36.00, Stock: 70, Categoria: "Exfoliación", Img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 7, Nombre: "Bruma Facial de Rosas y Lavanda", Descripcion: "Rocío refrescante con hidrolato de lavanda y agua de rosas orgánicas para tonificar.", Precio: 22.50, Stock: 95, Categoria: "Hidratación", Img: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 8, Nombre: "Contorno de Ojos Cafeína Verde", Descripcion: "Descongestiona ojeras y líneas finas con extracto de cafeína verde y pepino fresco.", Precio: 38.00, Stock: 60, Categoria: "Facial", Img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 9, Nombre: "Aceite Facial Jojoba y Rosa Mosqueta", Descripcion: "Elixir regenerador nocturno rico en antioxidantes y ácidos grasos esenciales.", Precio: 42.00, Stock: 75, Categoria: "Tratamiento", Img: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 10, Nombre: "Protector Solar Mineral SPF 50+", Descripcion: "Filtros minerales con acabado invisible, textura sedosa y protección de amplio espectro.", Precio: 34.50, Stock: 110, Categoria: "Cuidado Diario", Img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 11, Nombre: "Mascarilla Arcilla Verde y Eucalipto", Descripcion: "Purifica profundamente los poros y equilibra el exceso de brillo con eucalipto silvestre.", Precio: 29.00, Stock: 65, Categoria: "Tratamiento", Img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&auto=format&fit=crop&q=80", Activo: true},
			{ID: 12, Nombre: "Bálsamo Reparador Cica y Karité", Descripcion: "Nutrición intensiva para labios con centella asiática y manteca de karité pura.", Precio: 16.50, Stock: 120, Categoria: "Cuidado Diario", Img: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80", Activo: true},
		},
		red: models.Referido{
			ID:     0,
			Nombre: "Tú",
			Nivel:  0,
			Ventas: 2400,
			Hijos: []models.Referido{
				{
					ID:     1,
					Nombre: "Ana García",
					Nivel:  1,
					Ventas: 1200,
					Hijos: []models.Referido{
						{
							ID:     4,
							Nombre: "Carlos Ruiz",
							Nivel:  2,
							Ventas: 500,
							Hijos: []models.Referido{
								{ID: 7, Nombre: "Diana Paz", Nivel: 3, Ventas: 300},
							},
						},
						{ID: 5, Nombre: "Sofía León", Nivel: 2, Ventas: 430},
					},
				},
				{
					ID:     2,
					Nombre: "Luis Poveda",
					Nivel:  1,
					Ventas: 850,
					Hijos: []models.Referido{
						{ID: 6, Nombre: "Marco Díaz", Nivel: 2, Ventas: 380},
					},
				},
				{ID: 3, Nombre: "Marta Sánchez", Nivel: 1, Ventas: 430},
			},
		},
		usuarios: []models.Usuario{
			{ID: 1, Email: "admin@upse.edu.ec", Password: string(adminPass), Nombre: "Administrador", Rol: "admin", Activo: true},
			{ID: 2, Email: "cliente@upse.edu.ec", Password: string(clientePass), Nombre: "Cliente Demo", Rol: "cliente", Activo: true},
		},
		comisiones: []models.Comision{
			{ID: 1, PedidoID: 1, ReferidoID: 2, Nivel: 1, Porcentaje: 10, Monto: 15.00, Estado: "pendiente", CreadoEn: "2026-10-21 10:00:00"},
			{ID: 2, PedidoID: 2, ReferidoID: 2, Nivel: 1, Porcentaje: 10, Monto: 20.00, Estado: "pagada", LiquidacionID: &liqIDDemo, CreadoEn: "2026-10-20 12:00:00"},
		},
		liquidaciones: []models.Liquidacion{
			{ID: 1, ReferidoID: 2, ReferidoNombre: "Cliente Demo", ReferidoEmail: "cliente@upse.edu.ec", Total: 20.00, Estado: "pagada", CreadoEn: "2026-10-20 14:00:00"},
		},
	}
}

// GetAllProducts implementa ProductRepository (devuelve solo productos activos)
func (r *MemoryRepository) GetAllProducts() ([]models.Producto, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var activos []models.Producto
	for _, p := range r.productos {
		if p.Activo {
			activos = append(activos, p)
		}
	}
	return activos, nil
}

// GetProductByID implementa ProductRepository (devuelve producto si está activo)
func (r *MemoryRepository) GetProductByID(id int) (*models.Producto, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, p := range r.productos {
		if p.ID == id && p.Activo {
			return &p, nil
		}
	}
	return nil, models.ErrNoEncontrado
}

// GetByEmail implementa RedRepository
func (r *MemoryRepository) GetByEmail(email string) (*models.Referido, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return &r.red, nil
}

// ActualizarComisiones implementa RedRepository (simula actualización de comisiones)
func (r *MemoryRepository) ActualizarComisiones(email string, comision float64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.red.Ventas += comision
	return nil
}

// BeginTransaction implementa OrderRepository
func (r *MemoryRepository) BeginTransaction() (interfaces.Transaction, error) {
	return &MemoryTransaction{
		pedidos: &r.pedidos,
		items:   &r.items,
		mu:      &r.mu,
	}, nil
}

// === UserRepository (Memory) ===

// Create implementa UserRepository en memoria
func (r *MemoryRepository) Create(req models.RegisterRequest) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Verificar si email ya existe
	for _, u := range r.usuarios {
		if u.Email == req.Email {
			return errors.New("email ya registrado")
		}
	}

	// Hashear password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Crear usuario
	userID := len(r.usuarios) + 1
	nuevoUsuario := models.Usuario{
		ID:       userID,
		Email:    req.Email,
		Password: string(hashedPassword),
		Nombre:   req.Nombre,
		Rol:      "cliente",
		Activo:   true,
	}
	r.usuarios = append(r.usuarios, nuevoUsuario)

	// Crear nodo en referidos
	nuevoReferido := models.Referido{
		ID:     userID,
		Nombre: req.Nombre,
		Nivel:  utils.CalcularNivel(nil),
		Ventas: 0,
	}
	r.red = nuevoReferido

	return nil
}

// GetUserByEmail implementa UserRepository en memoria
func (r *MemoryRepository) GetUserByEmail(email string) (*models.Usuario, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, u := range r.usuarios {
		if u.Email == email {
			if !u.Activo {
				return nil, errors.New("cuenta desactivada")
			}
			return &u, nil
		}
	}
	return nil, models.ErrNoEncontrado
}

// GetUserByID implementa UserRepository en memoria
func (r *MemoryRepository) GetUserByID(id int) (*models.Usuario, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, u := range r.usuarios {
		if u.ID == id {
			return &u, nil
		}
	}
	return nil, models.ErrNoEncontrado
}

// GetAllUsers implementa UserRepository en memoria
func (r *MemoryRepository) GetAllUsers() ([]models.Usuario, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	res := make([]models.Usuario, len(r.usuarios))
	copy(res, r.usuarios)
	return res, nil
}

// UpdateEstadoUsuario activa o desactiva un usuario en memoria
func (r *MemoryRepository) UpdateEstadoUsuario(id int, activo bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, u := range r.usuarios {
		if u.ID == id {
			r.usuarios[i].Activo = activo
			return nil
		}
	}
	return models.ErrNoEncontrado
}

// === ProductRepository CRUD ===

// CreateProduct implementa ProductRepository
func (r *MemoryRepository) CreateProduct(producto models.Producto) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	producto.ID = len(r.productos) + 1
	producto.Activo = true
	r.productos = append(r.productos, producto)
	return nil
}

// UpdateProduct implementa ProductRepository
func (r *MemoryRepository) UpdateProduct(id int, producto models.Producto) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, p := range r.productos {
		if p.ID == id {
			r.productos[i] = producto
			return nil
		}
	}
	return models.ErrNoEncontrado
}

// DeleteProduct implementa ProductRepository (borrado lógico)
func (r *MemoryRepository) DeleteProduct(id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, p := range r.productos {
		if p.ID == id {
			r.productos[i].Activo = false
			return nil
		}
	}
	return models.ErrNoEncontrado
}

// === OrderRepository (lectura y estado) ===

// GetByUsuario implementa OrderRepository
func (r *MemoryRepository) GetByUsuario(usuarioID int) ([]models.Pedido, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var pedidosUsuario []models.Pedido
	for _, p := range r.pedidos {
		if p.UsuarioID == usuarioID {
			pedidosUsuario = append(pedidosUsuario, p)
		}
	}
	return pedidosUsuario, nil
}

// GetAll implementa OrderRepository
func (r *MemoryRepository) GetAll() ([]models.Pedido, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.pedidos, nil
}

// GetByID implementa OrderRepository
func (r *MemoryRepository) GetByID(id int) (*models.Pedido, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, p := range r.pedidos {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, models.ErrNoEncontrado
}

// UpdateEstado implementa OrderRepository
func (r *MemoryRepository) UpdateEstado(id int, estado string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, p := range r.pedidos {
		if p.ID == id {
			r.pedidos[i].Estado = estado
			return nil
		}
	}
	return models.ErrNoEncontrado
}

// === ComisionRepository (Memory) ===

// CrearComision registra una nueva comisión en memoria
func (r *MemoryRepository) CrearComision(c models.Comision) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	c.ID = len(r.comisiones) + 1
	if c.Estado == "" {
		c.Estado = "pendiente"
	}
	if c.CreadoEn == "" {
		c.CreadoEn = time.Now().Format("2006-01-02 15:04:05")
	}
	r.comisiones = append(r.comisiones, c)
	return nil
}

// GetComisionesByUsuario obtiene comisiones y totales para un usuario
func (r *MemoryRepository) GetComisionesByUsuario(usuarioID int) ([]models.Comision, float64, float64, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var lista []models.Comision
	var totalPendiente, totalPagada float64

	for _, c := range r.comisiones {
		if c.ReferidoID == usuarioID {
			lista = append(lista, c)
			if c.Estado == "pendiente" {
				totalPendiente += c.Monto
			} else if c.Estado == "pagada" {
				totalPagada += c.Monto
			}
		}
	}
	return lista, totalPendiente, totalPagada, nil
}

// GetPendientesPorLiquidar agrupa comisiones pendientes para liquidación
func (r *MemoryRepository) GetPendientesPorLiquidar() ([]map[string]interface{}, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	acumulados := make(map[int]float64)
	for _, c := range r.comisiones {
		if c.Estado == "pendiente" {
			acumulados[c.ReferidoID] += c.Monto
		}
	}

	var resultado []map[string]interface{}
	for refID, total := range acumulados {
		nombre := fmt.Sprintf("Usuario #%d", refID)
		email := ""
		for _, u := range r.usuarios {
			if u.ID == refID {
				nombre = u.Nombre
				email = u.Email
				break
			}
		}
		resultado = append(resultado, map[string]interface{}{
			"referido_id": refID,
			"nombre":      nombre,
			"email":       email,
			"total":       total,
		})
	}
	return resultado, nil
}

// === LiquidacionRepository (Memory) ===

// CrearLiquidacion liquida las comisiones pendientes de un distribuidor de forma idempotente
func (r *MemoryRepository) CrearLiquidacion(referidoID int) (*models.Liquidacion, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	total := 0.0
	var pendientesIdx []int
	for i, c := range r.comisiones {
		if c.ReferidoID == referidoID && c.Estado == "pendiente" {
			total += c.Monto
			pendientesIdx = append(pendientesIdx, i)
		}
	}

	if len(pendientesIdx) == 0 || total <= 0 {
		return nil, errors.New("no hay comisiones pendientes para liquidar a este distribuidor")
	}

	liqID := len(r.liquidaciones) + 1
	nombre := fmt.Sprintf("Distribuidor #%d", referidoID)
	email := ""
	for _, u := range r.usuarios {
		if u.ID == referidoID {
			nombre = u.Nombre
			email = u.Email
			break
		}
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	liq := models.Liquidacion{
		ID:             liqID,
		ReferidoID:     referidoID,
		ReferidoNombre: nombre,
		ReferidoEmail:  email,
		Total:          total,
		Estado:         "pagada",
		CreadoEn:       now,
		PagadaEn:       &now,
	}

	for _, idx := range pendientesIdx {
		r.comisiones[idx].Estado = "pagada"
		r.comisiones[idx].LiquidacionID = &liqID
	}

	r.liquidaciones = append(r.liquidaciones, liq)
	return &liq, nil
}

// GetAllLiquidaciones devuelve el historial de liquidaciones
func (r *MemoryRepository) GetAllLiquidaciones() ([]models.Liquidacion, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.liquidaciones, nil
}

// GetLiquidacionesByUsuario devuelve las liquidaciones cobradas por un usuario
func (r *MemoryRepository) GetLiquidacionesByUsuario(usuarioID int) ([]models.Liquidacion, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var lista []models.Liquidacion
	for _, l := range r.liquidaciones {
		if l.ReferidoID == usuarioID {
			lista = append(lista, l)
		}
	}
	return lista, nil
}
