package repository

import (
	"context"
	"database/sql"
	"errors"

	"multicatalogo-backend/config"
	"multicatalogo-backend/interfaces"
	"multicatalogo-backend/models"
	"multicatalogo-backend/utils"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// PostgresUserRepository implementa UserRepository usando PostgreSQL
type PostgresUserRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresUserRepository crea una nueva instancia
func NewPostgresUserRepository() interfaces.UserRepository {
	if !config.PostgresAvailable {
		return nil // Fallback a memoria en main.go
	}
	return &PostgresUserRepository{
		pool: config.PostgresPool,
	}
}

// Create implementa UserRepository
func (r *PostgresUserRepository) Create(req models.RegisterRequest) error {
	if !config.PostgresAvailable {
		return errors.New("PostgreSQL no disponible")
	}

	// Hashear password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Buscar referido por código si se proporcionó
	var referidoID *int
	if req.Ref != "" {
		var refID int
		err := r.pool.QueryRow(
			context.Background(),
			"SELECT id FROM referidos WHERE codigo = $1",
			req.Ref,
		).Scan(&refID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return errors.New("código de referido inválido")
			}
			return err
		}
		referidoID = &refID
	}

	// Insertar usuario en transacción
	tx, err := r.pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	// Insertar usuario
	var userID int
	err = tx.QueryRow(
		context.Background(),
		`INSERT INTO usuarios (email, password, nombre, rol, activo, referido_id)
		 VALUES ($1, $2, $3, 'cliente', true, $4)
		 RETURNING id`,
		req.Email, string(hashedPassword), req.Nombre, referidoID,
	).Scan(&userID)
	if err != nil {
		// Verificar si el email ya existe (violación de UNIQUE constraint)
		if err.Error() == "duplicate key value violates unique constraint \"usuarios_email_key\"" {
			return errors.New("email ya registrado")
		}
		return err
	}

	// Crear nodo en referidos
	codigo := utils.GenerarCodigo(req.Email)
	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO referidos (usuario_id, codigo, parent_id, nivel, ventas)
		 VALUES ($1, $2, $3, $4, 0)`,
		userID, codigo, referidoID, utils.CalcularNivel(referidoID),
	)
	if err != nil {
		return err
	}

	return tx.Commit(context.Background())
}

// GetUserByEmail implementa UserRepository
func (r *PostgresUserRepository) GetUserByEmail(email string) (*models.Usuario, error) {
	if !config.PostgresAvailable {
		return nil, errors.New("PostgreSQL no disponible")
	}

	var u models.Usuario
	var referidoID sql.NullInt32
	err := r.pool.QueryRow(
		context.Background(),
		`SELECT id, email, password, nombre, rol, activo, referido_id, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS')
		 FROM usuarios WHERE email = $1 AND activo = true`,
		email,
	).Scan(&u.ID, &u.Email, &u.Password, &u.Nombre, &u.Rol, &u.Activo, &referidoID, &u.CreadoEn)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrNoEncontrado
		}
		return nil, err
	}

	if referidoID.Valid {
		id := int(referidoID.Int32)
		u.ReferidoID = &id
	}

	return &u, nil
}

// GetUserByID implementa UserRepository
func (r *PostgresUserRepository) GetUserByID(id int) (*models.Usuario, error) {
	if !config.PostgresAvailable {
		return nil, errors.New("PostgreSQL no disponible")
	}

	var u models.Usuario
	var referidoID sql.NullInt32
	err := r.pool.QueryRow(
		context.Background(),
		`SELECT id, email, password, nombre, rol, activo, referido_id, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS')
		 FROM usuarios WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.Password, &u.Nombre, &u.Rol, &u.Activo, &referidoID, &u.CreadoEn)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrNoEncontrado
		}
		return nil, err
	}

	if referidoID.Valid {
		id := int(referidoID.Int32)
		u.ReferidoID = &id
	}

	return &u, nil
}

// GetAllUsers implementa UserRepository devolviendo todos los usuarios ordenados por ID
func (r *PostgresUserRepository) GetAllUsers() ([]models.Usuario, error) {
	if !config.PostgresAvailable {
		return nil, errors.New("PostgreSQL no disponible")
	}

	rows, err := r.pool.Query(
		context.Background(),
		`SELECT id, email, nombre, rol, activo, referido_id, TO_CHAR(creado_en, 'YYYY-MM-DD HH24:MI:SS')
		 FROM usuarios ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usuarios []models.Usuario
	for rows.Next() {
		var u models.Usuario
		var referidoID sql.NullInt32
		if err := rows.Scan(&u.ID, &u.Email, &u.Nombre, &u.Rol, &u.Activo, &referidoID, &u.CreadoEn); err != nil {
			return nil, err
		}
		if referidoID.Valid {
			id := int(referidoID.Int32)
			u.ReferidoID = &id
		}
		usuarios = append(usuarios, u)
	}

	return usuarios, rows.Err()
}

// UpdateEstadoUsuario activa o desactiva un usuario por ID
func (r *PostgresUserRepository) UpdateEstadoUsuario(id int, activo bool) error {
	if !config.PostgresAvailable {
		return errors.New("PostgreSQL no disponible")
	}

	cmd, err := r.pool.Exec(
		context.Background(),
		"UPDATE usuarios SET activo = $1 WHERE id = $2",
		activo, id,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return models.ErrNoEncontrado
	}
	return nil
}
