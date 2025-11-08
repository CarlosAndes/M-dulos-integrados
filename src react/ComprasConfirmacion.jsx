import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ComprasConfirmacion() {
  const [compra, setCompra] = useState(null);

  useEffect(() => {
    const ultimaCompra = localStorage.getItem("ultimoTiquete");
    if (ultimaCompra) {
      setCompra(JSON.parse(ultimaCompra));
    }
  }, []);

  if (!compra) {
    return (
      <div className="container">
        <h2>No hay ninguna compra registrada.</h2>
        <Link to="/compras" className="btn btn-green">Volver</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>✅ Compra realizada con éxito</h2>
      <p><strong>Referencia:</strong> {compra.referencia}</p>
      <p><strong>Origen:</strong> {compra.origen}</p>
      <p><strong>Destino:</strong> {compra.destino}</p>
      <p><strong>Hora:</strong> {compra.hora}</p>
      <p><strong>Fecha:</strong> {compra.fecha}</p>
      <p><strong>Asientos:</strong> {compra.asientos.join(", ")}</p>
      <Link to="/menu" className="btn btn-green">Volver al menú</Link>
    </div>
  );
}

export default ComprasConfirmacion;
