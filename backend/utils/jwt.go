package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"multicatalogo-backend/models"
)

var (
	ErrTokenInvalido = errors.New("token inválido o expirado")
)

// JWTClaims define la estructura de las declaraciones en el token JWT
type JWTClaims struct {
	UserID int    `json:"sub"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
	Nombre string `json:"nombre"`
	jwt.RegisteredClaims
}

// GetJWTSecret obtiene la clave secreta desde el entorno o usa un valor por defecto seguro
func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "multicatalogo_jwt_secret_key_2026_super_segura_upse"
	}
	return []byte(secret)
}

// GenerateJWT crea un token firmado HS256 con vigencia de 2 horas
func GenerateJWT(usuario *models.Usuario) (string, error) {
	claims := JWTClaims{
		UserID: usuario.ID,
		Email:  usuario.Email,
		Rol:    usuario.Rol,
		Nombre: usuario.Nombre,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "multicatalogo-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(GetJWTSecret())
}

// ValidateJWT valida la firma del token y retorna los claims si es válido
func ValidateJWT(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalido
		}
		return GetJWTSecret(), nil
	})

	if err != nil || !token.Valid {
		return nil, ErrTokenInvalido
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, ErrTokenInvalido
	}

	return claims, nil
}
