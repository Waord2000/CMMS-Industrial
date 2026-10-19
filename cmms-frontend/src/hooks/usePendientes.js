import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrdenes } from "../services/ordenesTrabajoService";
import { getPlanes } from "../services/planesMantenimientoService";
import { calcularPendientes } from "../Utils/mantenimientos";

// Calcula los mantenimientos pendientes y se actualiza cada vez que cambias de pantalla.
export default function usePendientes() {
  const location = useLocation();
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [ordenes, planes] = await Promise.all([getOrdenes(), getPlanes()]);
        if (!cancelado) setPendientes(calcularPendientes(planes, ordenes));
      } catch {
        if (!cancelado) setPendientes([]);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [location.pathname]);

  return pendientes;
}