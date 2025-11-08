import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3000");

const Dashboard = () => {
  const [compras, setCompras] = useState([]);

  useEffect(() => {
    // Traer ventas iniciales
    const fetchVentas = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/ventas");
        setCompras(res.data);
      } catch (error) {
        console.error("Error al obtener ventas:", error);
      }
    };
    fetchVentas();
  }, []);

  useEffect(() => {
    socket.on("nueva-compra", (compra) => {
      setCompras(prev => [compra, ...prev]);
    });

    return () => socket.off("nueva-compra");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Ventas de Tiquetes</h1>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Comprador</th>
            <th>Documento</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Hora</th>
            <th>Asientos</th>
            <th>Precio</th>
            <th>Pasajeros</th>
            <th>Fecha Compra</th>
            <th>Hora Compra</th>
            <th>Modo Pago</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {compras.map(c => (
            <tr key={c.id}>
              <td>{c.referencia}</td>
              <td>{c.comprador}</td>
              <td>{c.documento}</td>
              <td>{c.origen}</td>
              <td>{c.destino}</td>
              <td>{c.hora}</td>
              <td>{Array.isArray(c.asientos) ? c.asientos.join(", ") : c.asientos}</td>
              <td>${c.precio}</td>
              <td>{c.pasajeros}</td>
              <td>{c.fechaCompra}</td>
              <td>{c.horaCompra}</td>
              <td>{c.modoPago}</td>
              <td><button>Reimprimir PDF</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
