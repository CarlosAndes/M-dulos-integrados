// Menu.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Estilos.css";

const API_BASE = "http://localhost:3000";

/* -----------------------------
   Encomiendas (consulta real)
----------------------------- */
const Encomiendas = () => {
  const [cedula, setCedula] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState("");

  const buscar = async () => {
    setError("");
    setResultados([]);
    const cc = cedula.trim();

    if (!cc) {
      setError("Ingresa tu número de cédula.");
      return;
    }
    if (!/^\d+$/.test(cc)) {
      setError("La cédula debe tener solo números.");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_BASE}/api/encomiendas?cedula=${cc}`);
      if (!res.ok) throw new Error("Respuesta no OK del servidor");
      const data = await res.json();
      setResultados(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo consultar. Verifica que el servidor Node esté en http://localhost:3000.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="seccion">
      <h2>📦 Consulta de Envíos</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Ingresa tu cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
        <button className="btn btn-blue" onClick={buscar}>
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </div>

      {error && <p style={{ color: "#c00" }}>{error}</p>}

      {!cargando && !error && resultados.length === 0 && (
        <p>No se encontró ninguna encomienda con esa cédula.</p>
      )}

      {resultados.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {resultados.map((e) => (
            <div key={e.id} className="card">
              <h3 style={{ marginTop: 0 }}>Envío #{e.id}</h3>
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
                <strong>Remitente:</strong> {e.nombreRemitente} ({e.cedulaRemitente})
              </p>
              <p>
                <strong>Destinatario:</strong> {e.nombreDestinatario} ({e.cedulaDestinatario})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -----------------------------
   Quejas (mailto + POST opcional)
----------------------------- */
const Quejas = () => {
  const [nombre, setNombre] = useState("");
  const [correoSoporte] = useState("contacto@coonorte.com"); // correo destino
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setEstado("");

    // 1) Siempre abre el cliente de correo (funciona sin backend)
    const subject = encodeURIComponent(`Queja de ${nombre || "Cliente"}`);
    const body = encodeURIComponent(mensaje);
    window.open(`mailto:${correoSoporte}?subject=${subject}&body=${body}`, "_blank");

    // 2) Intento opcional al backend (si existe /api/quejas, lo guarda; si no, ignoramos)
    try {
      const resp = await fetch(`${API_BASE}/api/quejas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correoRemitente: correoSoporte, mensaje }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEstado(data?.mensaje || "Queja enviada (backend). Revisa tu correo.");
      } else {
        setEstado("Queja enviada por correo. (El backend /api/quejas no está disponible).");
      }
    } catch {
      setEstado("Queja enviada por correo. (Sin conexión al backend).");
    }

    setNombre("");
    setMensaje("");
  };

  return (
    <div className="seccion">
      <h2>📢 Enviar Queja</h2>
      <form onSubmit={enviar} className="form">
        <label>Tu nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label>Correo de destino</label>
        <input type="email" value={correoSoporte} readOnly />

        <label>Mensaje</label>
        <textarea
          rows={5}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
        />

        <button className="btn btn-green" type="submit">Enviar</button>
      </form>

      {estado && <p style={{ marginTop: 10 }}>{estado}</p>}
    </div>
  );
};

/* -----------------------------
   Menú principal
----------------------------- */
export default function Menu() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [pestana, setPestana] = useState("menu"); // menu | encomiendas | quejas
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const nombre = localStorage.getItem("usuarioLogueado");
    if (!nombre) {
      navigate("/"); // vuelve al login si no hay sesión
      return;
    }
    setUsuario(nombre);
  }, [navigate]);

  const salir = () => {
    localStorage.removeItem("usuarioLogueado");
    localStorage.removeItem("usuarioLogueadoEmail");
    navigate("/");
  };

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <img
            src="https://buscobus.com.co/wp-content/uploads/2017/05/coonorte.jpg"
            alt="Coonorte"
            className="logo"
          />
          <div id="userGreeting">Bienvenido, {usuario}</div>
          <button className="menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>
            ☰
          </button>
        </div>

        <nav className={`nav ${menuAbierto ? "show" : ""}`}>
          <button onClick={() => setPestana("menu")} className={pestana === "menu" ? "active" : ""}>
            Menú
          </button>
          <button onClick={() => navigate("/compras")}>Comprar tiquete</button>
          <button onClick={() => navigate("/contacto")}>Contacto</button>
          <button onClick={salir}>Cerrar sesión</button>
        </nav>
      </header>

      {/* Contenido */}
      <main className="container">
        {pestana === "menu" && (
          <>
            <h2>Menú Principal</h2>
            <div className="menu-grid">
              <button className="menu-card" onClick={() => navigate("/compras")}>
                🚌 Comprar Tiquete
              </button>
              <button className="menu-card" onClick={() => setPestana("encomiendas")}>
                📦 Encomiendas
              </button>
              <button className="menu-card" onClick={() => setPestana("quejas")}>
                📢 Quejas
              </button>
            </div>
          </>
        )}

        {pestana === "encomiendas" && <Encomiendas />}
        {pestana === "quejas" && <Quejas />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="supertransporte">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUGdmcTbvDNkc7SScgSSXnKnG0-cFe3x7q8w&s"
            alt="Vigilado Supertransporte"
          />
        </div>
        <p>© 2025 Coonorte - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
