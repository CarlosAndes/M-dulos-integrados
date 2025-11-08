import React, { useState } from "react";
import "./Estilos.css";

const Quejas = () => {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo] = useState("contacto@coonorte.com");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cedula || !nombre || !mensaje) {
      setResultado({
        tipo: "error",
        mensaje: "❌ Por favor completa todos los campos obligatorios.",
      });
      return;
    }

    try {
      setEnviando(true);
      await new Promise((res) => setTimeout(res, 1200)); // simulación

      setResultado({
        tipo: "exito",
        mensaje: "✅ Tu queja ha sido enviada correctamente. Gracias por ayudarnos a mejorar.",
      });

      // Limpieza del formulario
      setCedula("");
      setNombre("");
      setMensaje("");
    } catch (error) {
      console.error(error);
      setResultado({
        tipo: "error",
        mensaje: "❌ Hubo un error al enviar tu queja. Intenta nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="quejas-wrapper">
      <div className="quejas-card">
        <h2 className="quejas-titulo">📢 Buzón de Quejas y Sugerencias</h2>
        <p className="quejas-descripcion">
          Tu opinión es muy importante para nosotros. Por favor, diligencia el
          siguiente formulario para enviarnos tu queja o sugerencia.
        </p>

        <form onSubmit={handleSubmit} className="quejas-form">
          <div className="campo">
            <label>Cédula *</label>
            <input
              type="text"
              placeholder="Ej: 1027890329"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Nombre completo *</label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Correo de contacto</label>
            <input type="email" value={correo} readOnly />
          </div>

          <div className="campo">
            <label>Queja o sugerencia *</label>
            <textarea
              placeholder="Describe tu queja con el mayor detalle posible..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-enviar" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar Queja"}
          </button>
        </form>

        {resultado && (
          <div
            className={`resultado ${
              resultado.tipo === "exito" ? "resultado-exito" : "resultado-error"
            }`}
          >
            {resultado.mensaje}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quejas;
