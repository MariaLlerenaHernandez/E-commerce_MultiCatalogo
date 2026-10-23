package utils

// GenerarCodigo genera un código simple basado en email (primeras 4 letras en mayúsculas)
func GenerarCodigo(email string) string {
	codigo := ""
	for i, c := range email {
		if i >= 4 {
			break
		}
		if c >= 'a' && c <= 'z' {
			codigo += string(c - 32)
		}
	}
	return codigo
}

// CalcularNivel calcula el nivel basado en el parent_id
// TODO: Consultar nivel del padre en la base de datos
func CalcularNivel(parentID *int) int {
	if parentID == nil {
		return 0
	}
	return 1 // Simplificado por ahora
}
