import { useEffect, useState } from "react";
import { useCart, type Producto } from "../context/CartContext";
import { API_URL } from "../config";

const Catalogo = () => {
  const { addToCart } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Al montar el componente, pedimos los productos al backend
  useEffect(() => {
    fetch(`${API_URL}/api/productos`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Producto[]) => setProductos(data))
      .catch(() => setError("No se pudieron cargar los productos"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-slate-500">Cargando productos...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Catálogo de Productos
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {productos.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-lg overflow-hidden
border border-slate-200 shadow-sm flex flex-col"
          >
            <img
              src={prod.img}
              alt={prod.nombre}
              className="w-full h-40
object-cover"
            />
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-slate-700">{prod.nombre}</h3>
              <p className="text-indigo-600 font-bold mt-2 mb-4">
                ${prod.precio.toFixed(2)}
              </p>

              <button
                onClick={() => addToCart(prod)}
                className="mt-auto w-full bg-slate-900 text-white py-2 rounded
text-sm hover:bg-indigo-600 transition"
              >
                Añadir al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Catalogo;
