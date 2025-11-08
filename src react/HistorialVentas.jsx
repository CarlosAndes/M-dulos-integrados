import React, { useState, useEffect } from "react";
import { descargarPDF } from "./utilsPDF"; // Puedes usar la misma función que ya tienes

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [encomiendas, setEncomiendas] = useState([]);

  useEffect(() => {
    setVentas(JSON.parse(localStorage.getItem("ventasTaquilla") || "[]"));
    setEncomiendas(JSON.parse(localStorage.getItem("encomiendas") || "[]"));
  }, []);

  const handleReimprimir = (referencia) => {
    const tiquete = ventas.find(v => v.referencia === referencia);
    if (!tiquete) return alert("No se encontró el tiquete");
    descargarPDF(tiquete);
  };

  const handleCancelar = (referencia) => {
    const index = ventas.findIndex(v => v.referencia === referencia);
    if (index === -1) return alert("No se encontró el tiquete");
    const actualizado = [...ventas];
    actualizado.splice(index, 1);
    localStorage.setItem("ventasTaquilla", JSON.stringify(actualizado));
    setVentas(actualizado);
    alert("Tiquete cancelado correctamente");
  };

  const toggleReclamado = (id) => {
    const actualizado = encomiendas.map(e => e.id === id ? {...e, reclamado: !e.reclamado} : e);
    setEncomiendas(actualizado);
    localStorage.setItem("encomiendas", JSON.stringify(actualizado));
  };

  const eliminarEncomienda = (id) => {
    const actualizado = encomiendas.filter(e => e.id !== id);
    setEncomiendas(actualizado);
    localStorage.setItem("encomiendas", JSON.stringify(actualizado));
  };

  return (
    <div className="container">
      <h2>Historial de Ventas y Encomiendas</h2>

      {/* ------------------ Historial Tiquetes ------------------ */}
      <div className="seccion">
        <h3>Historial de Tiquetes</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Asientos</th>
              <th>Precio</th>
              <th>Fecha Compra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.referencia}>
                <td>{v.referencia}</td>
                <td>{v.comprador}</td>
                <td>{v.documento}</td>
                <td>{v.origen}</td>
                <td>{v.destino}</td>
                <td>{v.fecha}</td>
                <td>{v.hora}</td>
                <td>{v.asientos.join(", ")}</td>
                <td>{v.precio}</td>
                <td>{v.fechaCompra}</td>
                <td>
                  <button className="btn btn-blue" onClick={() => handleReimprimir(v.referencia)}>Reimprimir</button>
                  <button className="btn btn-red" onClick={() => handleCancelar(v.referencia)}>Cancelar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------ Historial Encomiendas ------------------ */}
      <div className="seccion" style={{marginTop:40}}>
        <h3>Historial de Encomiendas</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Cédula Remitente</th>
              <th>Cédula Destinatario</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Destinatario</th>
              <th>Fecha de Envío</th>
              <th>Reclamado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {encomiendas.map(e => (
              <tr key={e.id}>
                <td>{e.cedulaRemitente}</td>
                <td>{e.cedulaDestinatario || ""}</td>
                <td>{e.origen || ""}</td>
                <td>{e.destinoEncomienda}</td>
                <td>{e.nombreDestinatario}</td>
                <td>{e.fechaEnvio}</td>
                <td>
                  <input type="checkbox" checked={e.reclamado} onChange={() => toggleReclamado(e.id)} />
                </td>
                <td>
                  <button className="btn btn-red" onClick={() => eliminarEncomienda(e.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
