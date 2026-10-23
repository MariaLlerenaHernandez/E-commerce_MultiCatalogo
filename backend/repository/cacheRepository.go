package repository

import (
	"context"
	"errors"
	"log"
	"time"

	"multicatalogo-backend/config"
)

// RedisCache implementa la interfaz CacheRepository usando Redis
type RedisCache struct{}

// NewRedisCache crea una nueva instancia del caché Redis
func NewRedisCache() *RedisCache {
	return &RedisCache{}
}

// Get implementa CacheRepository
func (c *RedisCache) Get(key string) (string, error) {
	if !config.RedisAvailable {
		return "", errors.New("redis no disponible")
	}
	return config.RedisClient.Get(context.Background(), key).Result()
}

// Set implementa CacheRepository (ttl en segundos)
func (c *RedisCache) Set(key string, value string, ttl int) error {
	if !config.RedisAvailable {
		log.Printf("⚠️  Caché omitido: Redis no disponible")
		return nil
	}
	return config.RedisClient.Set(context.Background(), key, value, time.Duration(ttl)*time.Second).Err()
}

// Delete implementa CacheRepository
func (c *RedisCache) Delete(key string) error {
	if !config.RedisAvailable {
		log.Printf("⚠️  Invalidación de caché omitida: Redis no disponible")
		return nil
	}
	return config.RedisClient.Del(context.Background(), key).Err()
}
