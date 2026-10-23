package config

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient    *redis.Client
	Ctx            = context.Background()
	RedisAvailable bool
)

// InitRedis inicializa el cliente de Redis leyendo desde variables de entorno
// Si Redis no está disponible, continúa ejecutando sin caché (modo educativo)
func InitRedis() {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     redisHost + ":" + redisPort,
		Password: "",
		DB:       0,
	})

	// Verificar conexión
	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Printf("⚠️  Redis no disponible (%s:%s): %v. Continuando sin caché (modo educativo).", redisHost, redisPort, err)
		RedisAvailable = false
	} else {
		log.Printf("✅ Redis conectado en %s:%s", redisHost, redisPort)
		RedisAvailable = true
	}
}
