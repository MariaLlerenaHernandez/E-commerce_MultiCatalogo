import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();
  const { login } = useAuth();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Enviamos las credenciales al backend en Go
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setError("");
        login(data.email); // Estado global: autenticado con el correo que devuelve la API
        navigate("/");
      } else {
        // 401: mostramos el mensaje que manda el servidor
        setError(data.error);
      }
    } catch {
      // El servidor no responde (apagado o sin red)
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-100
px-4"
    >
      <div
        className="max-w-md w-full bg-white rounded-xl shadow-md p-8
border border-slate-200"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">MultiCatálogo</h2>
          <p className="text-slate-500 mt-2">
            Ingresa a tu cuenta para continuar
          </p>
        </div>
        {error && (
          <div
            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6
text-center border border-red-200"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300
focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none
transition"
              placeholder="admin@upse.edu.ec"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300
focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none
transition"
              placeholder="••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg
hover:bg-indigo-700 transition"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
