package repository

import (
	"context"
	"errors"

	"multicatalogo-backend/config"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresRepository implementa ProductRepository, OrderRepository y RedRepository usando PostgreSQL real
type PostgresRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresRepository crea una nueva instancia del repositorio PostgreSQL
func NewPostgresRepository() *PostgresRepository {
	if !config.PostgresAvailable {
		return &PostgresRepository{}
	}
	return &PostgresRepository{
		pool: config.PostgresPool,
	}
}

// ==========================================
// 1. PRODUCT REPOSITORY (CRUD + Filtro Activo)
// ==========================================

// GetAllProducts implementa ProductRepository (solo productos activos)
func (r *PostgresRepository) GetAllProducts() ([]models.Producto, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetAllProducts()
	}

	query := `SELECT id, nombre, COALESCE(descripcion, ''), precio, stock, COALESCE(categoria, ''), COALESCE(img, ''), activo 
	          FROM productos WHERE activo = true ORDER BY id`
	rows, err := r.pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var productos []models.Producto
	for rows.Next() {
		var p models.Producto
		err := rows.Scan(
			&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Stock, &p.Categoria, &p.Img, &p.Activo,
		)
		if err != nil {
			return nil, err
		}
		productos = append(productos, p)
	}

	return productos, nil
}

// GetProductByID implementa ProductRepository
func (r *PostgresRepository) GetProductByID(id int) (*models.Producto, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetProductByID(id)
	}

	query := `SELECT id, nombre, COALESCE(descripcion, ''), precio, stock, COALESCE(categoria, ''), COALESCE(img, ''), activo 
	          FROM productos WHERE id = $1 AND activo = true`
	var p models.Producto
	err := r.pool.QueryRow(context.Background(), query, id).Scan(
		&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Stock, &p.Categoria, &p.Img, &p.Activo,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrNoEncontrado
		}
		return nil, err
	}
	return &p, nil
}

// CreateProduct implementa ProductRepository
func (r *PostgresRepository) CreateProduct(producto models.Producto) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().CreateProduct(producto)
	}

	query := `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, img, activo)
	          VALUES ($1, $2, $3, $4, $5, $6, true)`
	_, err := r.pool.Exec(
		context.Background(),
		query,
		producto.Nombre, producto.Descripcion, producto.Precio, producto.Stock, producto.Categoria, producto.Img,
	)
	return err
}

// UpdateProduct implementa ProductRepository
func (r *PostgresRepository) UpdateProduct(id int, producto models.Producto) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().UpdateProduct(id, producto)
	}

	query := `UPDATE productos 
	          SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, img = $6, activo = $7
	          WHERE id = $8`
	cmd, err := r.pool.Exec(
		context.Background(),
		query,
		producto.Nombre, producto.Descripcion, producto.Precio, producto.Stock, producto.Categoria, producto.Img, producto.Activo, id,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return models.ErrNoEncontrado
	}
	return nil
}

// DeleteProduct implementa ProductRepository (borrado lógico)
func (r *PostgresRepository) DeleteProduct(id int) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().DeleteProduct(id)
	}

	query := `UPDATE productos SET activo = false WHERE id = $1`
	cmd, err := r.pool.Exec(context.Background(), query, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return models.ErrNoEncontrado
	}
	return nil
}

// ==========================================
// 2. RED REPOSITORY (Árbol con CTE recursivo)
// ==========================================

// GetByEmail implementa RedRepository con reconstrucción jerárquica
func (r *PostgresRepository) GetByEmail(email string) (*models.Referido, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetByEmail(email)
	}

	// 1. Obtener nodo raíz correspondiente al email del usuario
	var raiz models.Referido
	var refID int
	queryRaiz := `
		SELECT r.id, u.nombre, r.nivel, COALESCE(r.ventas, 0)
		FROM referidos r
		JOIN usuarios u ON u.id = r.usuario_id
		WHERE u.email = $1
	`
	err := r.pool.QueryRow(context.Background(), queryRaiz, email).Scan(
		&refID, &raiz.Nombre, &raiz.Nivel, &raiz.Ventas,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &models.Referido{Nombre: email, Nivel: 0, Ventas: 0}, nil
		}
		return nil, err
	}
	raiz.ID = refID
	raiz.Hijos = []models.Referido{}

	// 2. Consulta recursiva CTE para obtener los 3 niveles de la red descendente
	queryDesc := `
		WITH RECURSIVE red_tree AS (
			SELECT r.id, r.usuario_id, u.nombre, r.parent_id, 1 as nivel_relativo, COALESCE(r.ventas, 0) as ventas
			FROM referidos r
			JOIN usuarios u ON u.id = r.usuario_id
			WHERE r.parent_id = $1
			UNION ALL
			SELECT r.id, r.usuario_id, u.nombre, r.parent_id, rt.nivel_relativo + 1, COALESCE(r.ventas, 0) as ventas
			FROM referidos r
			JOIN usuarios u ON u.id = r.usuario_id
			JOIN red_tree rt ON r.parent_id = rt.id
			WHERE rt.nivel_relativo < 3
		)
		SELECT id, nombre, COALESCE(parent_id, 0), nivel_relativo, ventas 
		FROM red_tree 
		ORDER BY nivel_relativo, id
	`
	rows, err := r.pool.Query(context.Background(), queryDesc, refID)
	if err != nil {
		return &raiz, nil
	}
	defer rows.Close()

	type filaRed struct {
		id            int
		nombre        string
		parentID      int
		nivelRelativo int
		ventas        float64
	}

	var filas []filaRed
	for rows.Next() {
		var f filaRed
		if err := rows.Scan(&f.id, &f.nombre, &f.parentID, &f.nivelRelativo, &f.ventas); err == nil {
			filas = append(filas, f)
		}
	}

	// Reconstruir árbol jerárquico
	nodos := make(map[int]*models.Referido)
	nodos[refID] = &raiz

	for _, f := range filas {
		nodo := &models.Referido{
			ID:     f.id,
			Nombre: f.nombre,
			Nivel:  f.nivelRelativo,
			Ventas: f.ventas,
			Hijos:  []models.Referido{},
		}
		nodos[f.id] = nodo
	}

	// Recorrer en orden inverso (de nivel 3 a nivel 1) para que los hijos ya estén en el nodo antes de agregarlo al padre
	for i := len(filas) - 1; i >= 0; i-- {
		f := filas[i]
		if padre, ok := nodos[f.parentID]; ok {
			padre.Hijos = append([]models.Referido{*nodos[f.id]}, padre.Hijos...)
		}
	}

	return &raiz, nil
}

// ActualizarComisiones implementa RedRepository
func (r *PostgresRepository) ActualizarComisiones(email string, comision float64) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().ActualizarComisiones(email, comision)
	}

	query := `UPDATE referidos SET ventas = ventas + $1 WHERE usuario_id = (SELECT id FROM usuarios WHERE email = $2)`
	_, err := r.pool.Exec(context.Background(), query, comision, email)
	return err
}

// ==========================================
// 3. ORDER REPOSITORY (Lectura, Estado y ACID)
// ==========================================

// GetByUsuario implementa OrderRepository
func (r *PostgresRepository) GetByUsuario(usuarioID int) ([]models.Pedido, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetByUsuario(usuarioID)
	}

	query := `SELECT id, numero, COALESCE(usuario_id, 0), email, nombre, COALESCE(direccion, ''), COALESCE(ciudad, ''), COALESCE(telefono, ''), COALESCE(metodo_pago, ''), total, estado, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS') as fecha
	          FROM pedidos WHERE usuario_id = $1 ORDER BY id DESC`
	rows, err := r.pool.Query(context.Background(), query, usuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pedidos []models.Pedido
	for rows.Next() {
		var p models.Pedido
		err := rows.Scan(
			&p.ID, &p.Numero, &p.UsuarioID, &p.Email, &p.Nombre,
			&p.Direccion, &p.Ciudad, &p.Telefono, &p.MetodoPago,
			&p.Total, &p.Estado, &p.Fecha,
		)
		if err != nil {
			return nil, err
		}
		pedidos = append(pedidos, p)
	}
	return pedidos, nil
}

// GetAll implementa OrderRepository
func (r *PostgresRepository) GetAll() ([]models.Pedido, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetAll()
	}

	query := `SELECT id, numero, COALESCE(usuario_id, 0), email, nombre, COALESCE(direccion, ''), COALESCE(ciudad, ''), COALESCE(telefono, ''), COALESCE(metodo_pago, ''), total, estado, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS') as fecha
	          FROM pedidos ORDER BY id DESC`
	rows, err := r.pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pedidos []models.Pedido
	for rows.Next() {
		var p models.Pedido
		err := rows.Scan(
			&p.ID, &p.Numero, &p.UsuarioID, &p.Email, &p.Nombre,
			&p.Direccion, &p.Ciudad, &p.Telefono, &p.MetodoPago,
			&p.Total, &p.Estado, &p.Fecha,
		)
		if err != nil {
			return nil, err
		}
		pedidos = append(pedidos, p)
	}
	return pedidos, nil
}

// GetByID implementa OrderRepository con sus items
func (r *PostgresRepository) GetByID(id int) (*models.Pedido, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetByID(id)
	}

	query := `SELECT id, numero, COALESCE(usuario_id, 0), email, nombre, COALESCE(direccion, ''), COALESCE(ciudad, ''), COALESCE(telefono, ''), COALESCE(metodo_pago, ''), total, estado, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS') as fecha
	          FROM pedidos WHERE id = $1`
	var p models.Pedido
	err := r.pool.QueryRow(context.Background(), query, id).Scan(
		&p.ID, &p.Numero, &p.UsuarioID, &p.Email, &p.Nombre,
		&p.Direccion, &p.Ciudad, &p.Telefono, &p.MetodoPago,
		&p.Total, &p.Estado, &p.Fecha,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrNoEncontrado
		}
		return nil, err
	}

	// Cargar items del pedido
	itemQuery := `SELECT id, pedido_id, producto_id, nombre, cantidad, precio_unitario, subtotal FROM pedido_items WHERE pedido_id = $1`
	itemRows, err := r.pool.Query(context.Background(), itemQuery, id)
	if err == nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var item models.PedidoItem
			if err := itemRows.Scan(&item.ID, &item.PedidoID, &item.ProductoID, &item.Nombre, &item.Cantidad, &item.Precio, &item.Subtotal); err == nil {
				p.Items = append(p.Items, item)
			}
		}
	}

	return &p, nil
}

// UpdateEstado implementa OrderRepository
func (r *PostgresRepository) UpdateEstado(id int, estado string) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().UpdateEstado(id, estado)
	}

	cmd, err := r.pool.Exec(context.Background(), "UPDATE pedidos SET estado = $1 WHERE id = $2", estado, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return models.ErrNoEncontrado
	}
	return nil
}

// BeginTransaction implementa OrderRepository
func (r *PostgresRepository) BeginTransaction() (interfaces.Transaction, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().BeginTransaction()
	}

	tx, err := r.pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	return &PostgresTransaction{tx: tx}, nil
}

// PostgresTransaction implementa Transaction con PostgreSQL
type PostgresTransaction struct {
	tx pgx.Tx
}

// InsertarPedido implementa Transaction
func (tx *PostgresTransaction) InsertarPedido(pedido *models.Pedido) error {
	query := `
		INSERT INTO pedidos (numero, usuario_id, email, nombre, direccion, ciudad, telefono, metodo_pago, total, estado)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, numero
	`
	return tx.tx.QueryRow(
		context.Background(),
		query,
		pedido.Numero, pedido.UsuarioID, pedido.Email, pedido.Nombre,
		pedido.Direccion, pedido.Ciudad, pedido.Telefono, pedido.MetodoPago,
		pedido.Total, pedido.Estado,
	).Scan(&pedido.ID, &pedido.Numero)
}

// InsertarPedidoItems implementa Transaction
func (tx *PostgresTransaction) InsertarPedidoItems(items []models.PedidoItem) error {
	for _, item := range items {
		if item.Cantidad <= 0 {
			return models.ErrCantidadInvalida
		}

		// Bloqueo y verificación de stock con FOR UPDATE
		var stockActual int
		err := tx.tx.QueryRow(
			context.Background(),
			"SELECT stock FROM productos WHERE id = $1 FOR UPDATE",
			item.ProductoID,
		).Scan(&stockActual)
		if err != nil {
			return err
		}

		if stockActual < item.Cantidad {
			return models.ErrStockInsuficiente
		}

		// Descontar stock atómicamente
		_, err = tx.tx.Exec(
			context.Background(),
			"UPDATE productos SET stock = stock - $1 WHERE id = $2",
			item.Cantidad, item.ProductoID,
		)
		if err != nil {
			return err
		}

		// Insertar item
		_, err = tx.tx.Exec(
			context.Background(),
			`INSERT INTO pedido_items (pedido_id, producto_id, nombre, cantidad, precio_unitario, subtotal)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			item.PedidoID, item.ProductoID, item.Nombre, item.Cantidad, item.Precio, item.Subtotal,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

// Commit implementa Transaction
func (tx *PostgresTransaction) Commit() error {
	return tx.tx.Commit(context.Background())
}

// Rollback implementa Transaction
func (tx *PostgresTransaction) Rollback() error {
	return tx.tx.Rollback(context.Background())
}

// ==========================================
// 4. COMISION REPOSITORY (PostgreSQL)
// ==========================================

func (r *PostgresRepository) CrearComision(c models.Comision) error {
	if !config.PostgresAvailable {
		return NewMemoryRepository().CrearComision(c)
	}

	query := `INSERT INTO comisiones (pedido_id, referido_id, nivel, porcentaje, monto, estado)
	          VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6, ''), 'pendiente'))`
	_, err := r.pool.Exec(context.Background(), query, c.PedidoID, c.ReferidoID, c.Nivel, c.Porcentaje, c.Monto, c.Estado)
	return err
}

func (r *PostgresRepository) GetComisionesByUsuario(usuarioID int) ([]models.Comision, float64, float64, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetComisionesByUsuario(usuarioID)
	}

	query := `SELECT c.id, c.pedido_id, c.referido_id, c.nivel, c.porcentaje, c.monto, c.estado, c.liquidacion_id, TO_CHAR(c.creado_en, 'YYYY-MM-DD HH24:MI:SS')
	          FROM comisiones c
	          JOIN referidos r ON r.id = c.referido_id
	          WHERE r.usuario_id = $1
	          ORDER BY c.id DESC`
	rows, err := r.pool.Query(context.Background(), query, usuarioID)
	if err != nil {
		return nil, 0, 0, err
	}
	defer rows.Close()

	var comisiones []models.Comision
	var totalPendiente, totalPagada float64

	for rows.Next() {
		var c models.Comision
		err := rows.Scan(&c.ID, &c.PedidoID, &c.ReferidoID, &c.Nivel, &c.Porcentaje, &c.Monto, &c.Estado, &c.LiquidacionID, &c.CreadoEn)
		if err != nil {
			return nil, 0, 0, err
		}
		if c.Estado == "pendiente" {
			totalPendiente += c.Monto
		} else if c.Estado == "pagada" {
			totalPagada += c.Monto
		}
		comisiones = append(comisiones, c)
	}

	return comisiones, totalPendiente, totalPagada, nil
}

func (r *PostgresRepository) GetPendientesPorLiquidar() ([]map[string]interface{}, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetPendientesPorLiquidar()
	}

	query := `SELECT r.id as referido_id, u.nombre, u.email, COALESCE(SUM(c.monto), 0) as total
	          FROM comisiones c
	          JOIN referidos r ON r.id = c.referido_id
	          JOIN usuarios u ON u.id = r.usuario_id
	          WHERE c.estado = 'pendiente'
	          GROUP BY r.id, u.nombre, u.email`
	rows, err := r.pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []map[string]interface{}
	for rows.Next() {
		var refID int
		var nombre, email string
		var total float64
		if err := rows.Scan(&refID, &nombre, &email, &total); err == nil {
			lista = append(lista, map[string]interface{}{
				"referido_id": refID,
				"nombre":      nombre,
				"email":       email,
				"total":       total,
			})
		}
	}
	return lista, nil
}

// ==========================================
// 5. LIQUIDACION REPOSITORY (PostgreSQL ACID)
// ==========================================

func (r *PostgresRepository) CrearLiquidacion(referidoID int) (*models.Liquidacion, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().CrearLiquidacion(referidoID)
	}

	tx, err := r.pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	// 1. Bloquear y calcular comisiones pendientes con FOR UPDATE
	queryComisiones := `SELECT id, monto FROM comisiones WHERE referido_id = $1 AND estado = 'pendiente' FOR UPDATE`
	rows, err := tx.Query(context.Background(), queryComisiones, referidoID)
	if err != nil {
		return nil, err
	}

	var ids []int
	var total float64
	for rows.Next() {
		var id int
		var monto float64
		if err := rows.Scan(&id, &monto); err == nil {
			ids = append(ids, id)
			total += monto
		}
	}
	rows.Close()

	if len(ids) == 0 || total <= 0 {
		return nil, errors.New("no hay comisiones pendientes para liquidar a este distribuidor")
	}

	// 2. Insertar registro en liquidaciones
	var liq models.Liquidacion
	liq.ReferidoID = referidoID
	liq.Total = total
	liq.Estado = "pagada"

	queryLiq := `
		INSERT INTO liquidaciones (referido_id, total, estado, pagada_en)
		VALUES ($1, $2, 'pagada', NOW())
		RETURNING id, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(pagada_en, 'YYYY-MM-DD HH24:MI:SS')
	`
	var pagadaEn string
	err = tx.QueryRow(context.Background(), queryLiq, referidoID, total).Scan(&liq.ID, &liq.CreadoEn, &pagadaEn)
	if err != nil {
		return nil, err
	}
	liq.PagadaEn = &pagadaEn

	// 3. Actualizar comisiones a pagada con la FK de liquidacion_id
	queryUpdate := `UPDATE comisiones SET estado = 'pagada', liquidacion_id = $1 WHERE id = ANY($2)`
	_, err = tx.Exec(context.Background(), queryUpdate, liq.ID, ids)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return &liq, nil
}

func (r *PostgresRepository) GetAllLiquidaciones() ([]models.Liquidacion, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetAllLiquidaciones()
	}

	query := `SELECT l.id, l.referido_id, COALESCE(u.nombre, ''), COALESCE(u.email, ''), l.total, l.estado, 
	                 TO_CHAR(l.creado_en, 'YYYY-MM-DD HH24:MI:SS'), 
	                 TO_CHAR(l.pagada_en, 'YYYY-MM-DD HH24:MI:SS')
	          FROM liquidaciones l
	          JOIN referidos r ON r.id = l.referido_id
	          JOIN usuarios u ON u.id = r.usuario_id
	          ORDER BY l.id DESC`
	rows, err := r.pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.Liquidacion
	for rows.Next() {
		var l models.Liquidacion
		var pagadaEn *string
		err := rows.Scan(&l.ID, &l.ReferidoID, &l.ReferidoNombre, &l.ReferidoEmail, &l.Total, &l.Estado, &l.CreadoEn, &pagadaEn)
		if err == nil {
			l.PagadaEn = pagadaEn
			lista = append(lista, l)
		}
	}
	return lista, nil
}

func (r *PostgresRepository) GetLiquidacionesByUsuario(usuarioID int) ([]models.Liquidacion, error) {
	if !config.PostgresAvailable {
		return NewMemoryRepository().GetLiquidacionesByUsuario(usuarioID)
	}

	query := `SELECT l.id, l.referido_id, COALESCE(u.nombre, ''), COALESCE(u.email, ''), l.total, l.estado, 
	                 TO_CHAR(l.creado_en, 'YYYY-MM-DD HH24:MI:SS'), 
	                 TO_CHAR(l.pagada_en, 'YYYY-MM-DD HH24:MI:SS')
	          FROM liquidaciones l
	          JOIN referidos r ON r.id = l.referido_id
	          JOIN usuarios u ON u.id = r.usuario_id
	          WHERE r.usuario_id = $1
	          ORDER BY l.id DESC`
	rows, err := r.pool.Query(context.Background(), query, usuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.Liquidacion
	for rows.Next() {
		var l models.Liquidacion
		var pagadaEn *string
		err := rows.Scan(&l.ID, &l.ReferidoID, &l.ReferidoNombre, &l.ReferidoEmail, &l.Total, &l.Estado, &l.CreadoEn, &pagadaEn)
		if err == nil {
			l.PagadaEn = pagadaEn
			lista = append(lista, l)
		}
	}
	return lista, nil
}
