import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendario from "./pages/Calendario";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Maquinas from "./pages/Maquinas";
import Repuestos from "./pages/Repuestos";
import OrdenesTrabajo from "./pages/OrdenesTrabajo";
import Usuarios from "./pages/Usuarios";
import PlanesMantenimiento from "./pages/PlanesMantenimiento";
import ParosMaquina from "./pages/ParosMaquina";
import Indicadores from "./pages/Indicadores";
import Catalogos from "./pages/Catalogos";
import MovimientosInventario from "./pages/MovimientosInventario";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/olvide-contrasena" element={<ForgotPassword />} />
      <Route path="/restablecer-contrasena" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="maquinas" element={<Maquinas />} />
        <Route path="repuestos" element={<Repuestos />} />
        <Route path="movimientos-inventario" element={<MovimientosInventario />} />
        <Route path="paros-maquina" element={<ParosMaquina />} />
        <Route path="indicadores" element={<Indicadores />} />
        <Route path="planes-mantenimiento" element={<PlanesMantenimiento />} />
        <Route path="ordenes-trabajo" element={<OrdenesTrabajo />} />
        <Route
          path="catalogos"
          element={
          <ProtectedRoute roles={["Administrador"]}>
            <Catalogos />
          </ProtectedRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <ProtectedRoute roles={["Administrador"]}>
              <Usuarios />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}