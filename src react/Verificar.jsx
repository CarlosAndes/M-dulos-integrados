import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Estilos.css";

function Verificar() {
  const { referencia } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/verificar/${referencia}`);
        const data = await res.json();

        if (!res.ok || !data.valido) {
          setError(data.mensaje || "Tiquete inválido");
          return;
        }

        setInfo(data.venta);
      } catch {
        setError("Error conectando con el servidor.");
      }
    };

    verificar();
  }, [referencia]);

  if (error) {
    return (
      <div className="container">
        <h1 style={{ color: "red" }}>❌ Tiquete inválido</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!info) return <h2 className="container">Cargando...</h2>;

  return (
    <div className="container">
      <h1 style={{ color: "green" }}>✅ Tiquete válido</h1>
      <h2>Referencia: {info.referencia}</h2>

      <div className="verificar-box">

        <h3>Datos del pasajero</h3>
        <p><strong>Nombre:</strong> {info.comprador}</p>
        <p><strong>Cédula:</strong> {info.documento}</p>
        <p><strong>Pasajeros:</strong> {info.pasajeros}</p>
        <p><strong>Asientos:</strong> {info.asientos.join(", ")}</p>

        <h3>Datos del viaje</h3>
        <p><strong>Origen:</strong> {info.origen}</p>
        <p><strong>Destino:</strong> {info.destino}</p>
        <p><strong>Fecha del viaje:</strong> {info.fecha}</p>
        <p><strong>Hora del viaje:</strong> {info.hora}</p>

        <h3>Datos de compra</h3>
        <p><strong>Fecha compra:</strong> {info.fechaCompra}</p>
        <p><strong>Hora compra:</strong> {info.horaCompra}</p>
        <p><strong>Modo de pago:</strong> {info.modoPago}</p>
        <p><strong>Precio:</strong> ${info.precio}</p>
      </div>
    </div>
  );
}

export default Verificar;
