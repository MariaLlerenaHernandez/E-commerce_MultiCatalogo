package config

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	PostgresPool *pgxpool.Pool
	PostgresAvailable bool
)

// InitPostgres inicializa el pool de conexiones a PostgreSQL
func InitPostgres() {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5434"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "multicatalogo"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "multicatalogo123"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "multicatalogo"
	}

	connString := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s pool_max_conns=10",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	var err error
	PostgresPool, err = pgxpool.New(context.Background(), connString)
	if err != nil {
		log.Printf("⚠️  PostgreSQL no disponible: %v. Continuando sin persistencia (modo educativo).", err)
		PostgresAvailable = false
		return
	}

	// Verificar conexión
	if err := PostgresPool.Ping(context.Background()); err != nil {
		log.Printf("⚠️  No se pudo conectar a PostgreSQL: %v. Continuando sin persistencia (modo educativo).", err)
		PostgresAvailable = false
		return
	}

	log.Printf("✅ PostgreSQL conectado en %s:%s (BD: %s)", dbHost, dbPort, dbName)
	PostgresAvailable = true
}
