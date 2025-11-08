// Factura.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Estilos.css";

function Factura() {
  const navigate = useNavigate();
  const [compra, setCompra] = useState(null);

  /* ===========================================================
      ✅ Cargar información de la compra
  ============================================================ */
  useEffect(() => {
    const ultimo = JSON.parse(localStorage.getItem("ultimoTiquete"));

    if (!ultimo) {
      setCompra(null);
      return;
    }

    const fetchFactura = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/ventas?referencia=${ultimo.referencia}`
        );

        const data = await res.json();

        // ✅ Si existe en la base de datos, usarlo
        if (res.ok && data.length > 0) {
          const venta = data[0];

          // ✅ Asegurar que los asientos sean array
          try {
            venta.asientos = JSON.parse(venta.asientos);
          } catch {
            if (typeof venta.asientos === "string") {
              venta.asientos = venta.asientos.split(",").map((n) => Number(n));
            }
          }

          setCompra(venta);
        } else {
          // ✅ Si no existe, usar el guardado
          setCompra(ultimo);
        }
      } catch {
        setCompra(ultimo);
      }
    };

    fetchFactura();
  }, []);

  /* ===========================================================
      ✅ Validar compra
  ============================================================ */
  if (!compra) {
    return (
      <div className="container">
        <h2>No hay información de compra disponible</h2>
        <button onClick={() => navigate("/compras")} className="btn btn-green">
          Volver a comprar
        </button>
      </div>
    );
  }

  /* ===========================================================
      ✅ Convertir hora a 12 horas
  ============================================================ */
  const formato12Horas = (horaStr) => {
    if (!horaStr) return "";
    let [hora, min] = horaStr.split(":");
    let h = parseInt(hora);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${min} ${ampm}`;
  };

  const horaViajeFormateada = formato12Horas(compra.hora);

  /* ===========================================================
      ✅ Asegurar formato correcto de asientos
  ============================================================ */
  let asientosLista = [];

  if (Array.isArray(compra.asientos)) {
    asientosLista = compra.asientos;
  } else if (typeof compra.asientos === "string") {
    try {
      asientosLista = JSON.parse(compra.asientos);
    } catch {
      asientosLista = compra.asientos.split(",").map((n) => Number(n));
    }
  }

  /* ===========================================================
      ✅ QR data
  ============================================================ */
  const qrData = `${window.location.origin}/verificar/${compra.referencia}`;

  /* ===========================================================
      ✅ Generar PDF
  ============================================================ */
  const descargarPDF = () => {
    html2canvas(document.getElementById("factura")).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factura-${compra.referencia}.pdf`);
    });
  };

  /* ===========================================================
      ✅ Render
  ============================================================ */
  return (
    <div className="container factura" id="factura">
      <img
        src="https://buscobus.com.co/wp-content/uploads/2017/05/coonorte.jpg"
        alt="Logo"
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "250px",
          opacity: 0.15,
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Factura de Compra</h1>
        <p>
          <strong>Referencia:</strong> {compra.referencia}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* DATOS PRINCIPALES */}
        <div style={{ flex: 1, marginRight: "20px" }}>
          <h3>Datos del Pasajero</h3>
          <p>
            <strong>Nombre:</strong> {compra.comprador}
          </p>
          <p>
            <strong>Cédula:</strong> {compra.documento}
          </p>
          <p>
            <strong>Pasajeros:</strong> {compra.pasajeros}
          </p>
          <p>
            <strong>Asientos:</strong> {asientosLista.join(", ")}
          </p>

          <h3>Datos del Viaje</h3>
          <p>
            <strong>Origen:</strong> {compra.origen}
          </p>
          <p>
            <strong>Destino:</strong> {compra.destino}
          </p>
          <p>
            <strong>Fecha de viaje:</strong> {compra.fecha}
          </p>
          <p>
            <strong>Hora de viaje:</strong> {horaViajeFormateada}
          </p>

          <h3>Datos de Compra</h3>
          <p>
            <strong>Modo de pago:</strong> En taquilla
          </p>
          <p>
            <strong>Precio total:</strong> ${Number(compra.precio).toLocaleString()}
          </p>
        </div>

        {/* QR */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <QRCodeCanvas value={qrData} size={180} />
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
            Escanea el código para verificar tu tiquete
          </p>
        </div>
      </div>

      {/* BOTONES */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginTop: "40px",
        }}
      >
        <button onClick={() => navigate("/menu")} className="btn-green">
          Volver al menú
        </button>
        <button onClick={descargarPDF} className="btn-green">
          Descargar PDF
        </button>
      </div>
    </div>
  );
}

export default Factura;
