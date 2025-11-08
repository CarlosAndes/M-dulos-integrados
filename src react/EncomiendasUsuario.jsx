// EncomiendasUsuario.jsx
import React, { useState } from "react";
import "./Estilos.css";

const API = "http://localhost:3000/api/encomiendas";

function EncomiendasUsuario() {
  const [cedula, setCedula] = useState("");
  const [resultado, setResultado] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [consultado, setConsultado] = useState(false);

  const buscar = async () => {
    if (!cedula.trim()) {
      alert("Ingrese su número de cédula");
      return;
    }

    setCargando(true);
    setConsultado(true);

    try {
      const res = await fetch(`${API}?cedula=${cedula}`);
      const data = await res.json();

      setResultado(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Error al consultar las encomiendas");
    }

    setCargando(false);
  };

  return (
    <div className="seccion">
      <h2>📦 Consulta de Envíos</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Ingrese su cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
        <button onClick={buscar}>Consultar</button>
      </div>

      {cargando && <p>Cargando...</p>}

      {!cargando && consultado && resultado.length === 0 && (
        <p>No se encontró ninguna encomienda con esa cédula.</p>
      )}

      {resultado.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {resultado.map((e) => (
            <div key={e.id} className="card-envio">
              <h3>📦 Envío #{e.id}</h3>

              <p>
                <strong>Estado:</strong>{" "}
                {e.reclamado ? "Entregado ✅" : "En camino 🚚"}
              </p>

              <p>
                <strong>Origen:</strong> {e.lugarRemitente}
              </p>

              <p>
                <strong>Destino:</strong> {e.lugarEntrega}
              </p>

              <p>
                <strong>Fecha envío:</strong> {e.fechaEnvio}
              </p>

              <hr />

              <p>
                <strong>Remitente:</strong> {e.nombreRemitente} (
                {e.cedulaRemitente})
              </p>

              <p>
                <strong>Destinatario:</strong> {e.nombreDestinatario} (
                {e.cedulaDestinatario})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EncomiendasUsuario;
