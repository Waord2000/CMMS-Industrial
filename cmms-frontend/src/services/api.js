import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Los endpoints de /Auth responden 401 cuando las credenciales son incorrectas.
    // Eso no es una sesión vencida, así que ahí no se cierra sesión ni se recarga la página.
    const esAuth = error.config?.url?.includes("/Auth/");
    if (error.response?.status === 401 && !esAuth) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;