import React, { useState } from "react";
import "./Estilos.css";

function Pago() {
  const [banco, setBanco] = useState("");
  // Tomamos la compra pendiente (guardada por Compras.jsx)
  const compra = JSON.parse(localStorage.getItem("compraPendiente"));

  const abrirPlataformaBanco = (banco) => {
    const urls = {
      Nequi: "https://www.nequi.com.co/",
      Bancolombia: "https://www.bancolombia.com/personas",
      Davivienda: "https://www.davivienda.com/",
      "Banco Agrario": "https://www.bancoagrario.gov.co/",
      "Banco de Bogotá": "https://www.bancodebogota.com/",
      BBVA: "https://www.bbva.com.co/",
    };

    if (urls[banco]) {
      window.open(urls[banco], "_blank");
      // Mensaje informativo: se asume que el usuario completa la consignación externamente
      alert("Se abrió la plataforma del banco en una nueva pestaña. Realiza tu consignación y luego vuelve aquí para confirmar el pago.");
    }
  };

  const confirmarPago = () => {
    if (!banco) {
      alert("Selecciona un banco para continuar.");
      return;
    }
    if (!compra) {
      alert("No hay compra pendiente o la sesión expiró.");
      return;
    }

    const compraFinal = {
      ...compra,
      modoPago: banco,
      pagoConfirmado: true,
      fechaPago: new Date().toLocaleString(),
    };

    // Guardamos el tiquete final y removemos la compra pendiente
    localStorage.setItem("ultimoTiquete", JSON.stringify(compraFinal));
    localStorage.removeItem("compraPendiente");

    alert("✅ Pago confirmado correctamente. Se generará tu tiquete.");
    window.location.href = "/factura";
  };

  if (!compra) {
    return (
      <div className="container">
        <h2>No hay compras pendientes</h2>
        <p>No se encontró una compra en proceso. Completa el formulario de compra primero.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Selecciona tu método de pago</h2>

      <div className="compra-resumen">
        <p><strong>Origen:</strong> {compra.origen}</p>
        <p><strong>Destino:</strong> {compra.destino}</p>
        <p><strong>Fecha:</strong> {compra.fecha} &nbsp; <strong>Hora:</strong> {compra.hora}</p>
        <p><strong>Precio:</strong> {compra.precio}</p>
        <p><strong>Referencia:</strong> {compra.referencia}</p>
      </div>

      <label>Banco o método de pago</label>
      <select
        value={banco}
        onChange={(e) => {
          setBanco(e.target.value);
          // solo abrimos la web si el usuario selecciona un banco válido
          if (e.target.value) abrirPlataformaBanco(e.target.value);
        }}
      >
        <option value="">Selecciona tu banco</option>
        <option value="Nequi">Nequi</option>
        <option value="Bancolombia">Bancolombia</option>
        <option value="Davivienda">Davivienda</option>
        <option value="Banco Agrario">Banco Agrario</option>
        <option value="Banco de Bogotá">Banco de Bogotá</option>
        <option value="BBVA">BBVA</option>
      </select>

      <button onClick={confirmarPago} className="btn btn-green" style={{ marginTop: "15px" }}>
        Confirmar pago y generar tiquete
      </button>
    </div>
  );
}

export default Pago;
