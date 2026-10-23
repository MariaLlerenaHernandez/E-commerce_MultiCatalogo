package domain

// Comision representa una comisión individual en el ledger
type Comision struct {
	PedidoID    int     `json:"pedido_id"`
	ReferidoID  int     `json:"referido_id"`
	Nivel       int     `json:"nivel"`
	Porcentaje  float64 `json:"porcentaje"`
	Monto       float64 `json:"monto"`
}

// RepartirComisiones es una función pura que calcula las comisiones multinivel
// No tiene I/O, por lo que es fácilmente testeable
// total: monto total del pedido
// tasas: mapa de nivel -> porcentaje (ej: {1: 0.10, 2: 0.05, 3: 0.02})
func RepartirComisiones(total float64, tasas map[int]float64) []Comision {
	var comisiones []Comision
	
	for nivel, porcentaje := range tasas {
		monto := total * porcentaje
		comisiones = append(comisiones, Comision{
			PedidoID:   0, // Se asigna en el repo
			ReferidoID: 0, // Se asigna en el repo
			Nivel:      nivel,
			Porcentaje: porcentaje * 100,
			Monto:      monto,
		})
	}
	
	return comisiones
}
