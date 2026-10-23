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
// Soporta tanto REDIS_URL (formato URI en la nube) como REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
// Si Redis no está disponible, continúa ejecutando con fallback seguro
func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err == nil {
			RedisClient = redis.NewClient(opt)
			if _, pingErr := RedisClient.Ping(Ctx).Result(); pingErr == nil {
				log.Println("✅ Redis conectado exitosamente mediante REDIS_URL")
				RedisAvailable = true
				return
			}
			log.Printf("⚠️  No se pudo hacer ping a REDIS_URL: %v. Intentando por host/puerto...", err)
		}
	}

	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     redisHost + ":" + redisPort,
		Password: redisPassword,
		DB:       0,
	})

	// Verificar conexión
	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Printf("⚠️  Redis no disponible (%s:%s): %v. Continuando sin caché (modo tolerante a fallos).", redisHost, redisPort, err)
		RedisAvailable = false
	} else {
		log.Printf("✅ Redis conectado en %s:%s", redisHost, redisPort)
		RedisAvailable = true
	}
}
