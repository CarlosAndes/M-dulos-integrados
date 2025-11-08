// Compras.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Estilos.css";

function Compras() {
  const navigate = useNavigate();

  // ==========================
  // Validación de usuario registrado
  // ==========================
  useEffect(() => {
    const usuario = localStorage.getItem("usuarioLogueado");
    if (!usuario) {
      alert("Debes registrarte o iniciar sesión primero");
      navigate("/registro");
    }
  }, [navigate]);

  // ==========================
  // Estados principales
  // ==========================
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState("");
  const [fecha, setFecha] = useState("");
  const [documento, setDocumento] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [asientosOcupados, setAsientosOcupados] = useState([]);

  // ==========================
  // Rutas y precios
  // ==========================
  const rutas = {
    "Medellín→Andes": { precio: 30000, horarios: ["05:00", "08:00", "10:00", "14:00", "16:00", "18:00"] },
    "Medellín→Jardín": { precio: 35000, horarios: ["06:00", "09:00", "12:00", "15:00", "18:00"] },
    "Medellín→Caldas": { precio: 28000, horarios: ["07:00", "11:00", "16:00"] },
    "Medellín→Amagá": { precio: 25000, horarios: ["06:30", "10:30", "14:30"] },
    "Andes→Medellín": { precio: 30000, horarios: ["05:00", "08:00", "10:00", "14:00", "16:00", "18:00"] },
    "Andes→Jardín": { precio: 27000, horarios: ["07:30", "12:30", "16:30"] },
    "Jardín→Medellín": { precio: 35000, horarios: ["06:30", "09:30", "12:30", "15:30", "18:30"] },
    "Jardín→Andes": { precio: 27000, horarios: ["06:30", "11:30", "15:30"] },
    "Caldas→Medellín": { precio: 28000, horarios: ["08:00", "13:00", "17:00"] },
    "Amagá→Medellín": { precio: 25000, horarios: ["07:30", "12:30", "16:30"] },
  };

  const formato12Horas = (hora24) => {
    const [h, m] = hora24.split(":");
    const horaInt = parseInt(h, 10);
    const ampm = horaInt >= 12 ? "PM" : "AM";
    const hora12 = horaInt % 12 === 0 ? 12 : horaInt % 12;
    return `${hora12}:${m} ${ampm}`;
  };

  useEffect(() => {
    if (origen && destino && origen !== destino) {
      const key = `${origen}→${destino}`;
      if (rutas[key]) {
        setPrecio(rutas[key].precio);
        setHorariosDisponibles(rutas[key].horarios);
      } else {
        setPrecio("");
        setHorariosDisponibles([]);
      }
    } else {
      setPrecio("");
      setHorariosDisponibles([]);
    }
  }, [origen, destino]);

  // ==========================
  // Generar asientos
  // ==========================
  const generarAsientos = () => {
    const total = 28;
    const filas = Math.ceil(total / 4);
    const asientos = [];
    let numero = 1;
    for (let i = 0; i < filas; i++) {
      const fila = [];
      for (let j = 0; j < 4; j++) fila.push(numero++);
      asientos.push(fila);
    }
    return asientos;
  };
  const asientos = generarAsientos();

  // ==========================
  // Cargar asientos ocupados desde backend
  // ==========================
  useEffect(() => {
    const obtenerAsientosOcupados = async () => {
      if (!origen || !destino || !hora || !fecha) return;
      try {
        const res = await fetch(
          `http://localhost:3000/api/asientos-ocupados?origen=${origen}&destino=${destino}&hora=${hora}&fecha=${fecha}`
        );
        const data = await res.json();
        if (res.ok) setAsientosOcupados(data.ocupados || []);
      } catch (error) {
        console.error(error);
      }
    };
    obtenerAsientosOcupados();
  }, [origen, destino, hora, fecha]);

  // ==========================
  // Seleccionar asientos
  // ==========================
  const toggleAsiento = (num) => {
    if (asientosOcupados.includes(num)) return;
    if (asientosSeleccionados.includes(num)) {
      setAsientosSeleccionados(asientosSeleccionados.filter((a) => a !== num));
    } else {
      if (asientosSeleccionados.length < pasajeros)
        setAsientosSeleccionados([...asientosSeleccionados, num]);
      else alert(`Solo puedes seleccionar ${pasajeros} asiento(s).`);
    }
  };

  // ==========================
  // Registrar compra en el servidor
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!origen || !destino || !hora || !fecha || !documento) {
      alert("Todos los campos son obligatorios");
      return;
    }

    if (asientosSeleccionados.length !== parseInt(pasajeros)) {
      alert(`Debes seleccionar exactamente ${pasajeros} asiento(s).`);
      return;
    }

    let usuario = { id: 1, nombre: "Cliente anónimo" };
    const guardado = localStorage.getItem("usuarioLogueado");
    if (guardado) {
      try {
        usuario = JSON.parse(guardado);
      } catch {
        usuario.nombre = guardado;
      }
    }

    const ahora = new Date();
    const compra = {
      usuario_id: usuario.id || 1,
      referencia: "TKT-" + Date.now().toString().slice(-6),
      comprador: usuario.nombre || "Cliente anónimo",
      documento,
      origen,
      destino,
      hora,
      fecha,
      fechaCompra: ahora.toISOString().split("T")[0],
      horaCompra: ahora.toTimeString().split(" ")[0],
      modoPago: "efectivo",

      // ✅ AHORA SÍ: enviar array REAL
      asientos: asientosSeleccionados,

      precio: precio * pasajeros,
      pasajeros,
    };

    try {
      const res = await fetch("http://localhost:3000/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compra),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ultimoTiquete", JSON.stringify(compra));
        alert(`✅ Venta registrada con éxito. Referencia: ${compra.referencia}`);
        navigate("/factura");
      } else {
        alert(data.mensaje || "Error al registrar la venta");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión con el servidor");
    }
  };

  // ==========================
  // Vista
  // ==========================
  return (
    <div className="container">
      <h2>Comprar tiquete</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>Origen</label>
        <select value={origen} onChange={(e) => setOrigen(e.target.value)} required>
          <option value="">Selecciona origen</option>
          <option>Medellín</option>
          <option>Andes</option>
          <option>Jardín</option>
          <option>Caldas</option>
          <option>Amagá</option>
        </select>

        <label>Destino</label>
        <select value={destino} onChange={(e) => setDestino(e.target.value)} required>
          <option value="">Selecciona destino</option>
          <option>Medellín</option>
          <option>Andes</option>
          <option>Jardín</option>
          <option>Caldas</option>
          <option>Amagá</option>
        </select>

        <label>Hora de salida</label>
        <select value={hora} onChange={(e) => setHora(e.target.value)} required>
          <option value="">Selecciona hora</option>
          {horariosDisponibles.map((h) => (
            <option key={h} value={h}>
              {formato12Horas(h)}
            </option>
          ))}
        </select>

        <label>Fecha de viaje</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

        <label>Número de documento</label>
        <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} required />

        <label>Número de pasajeros</label>
        <input
          type="number"
          min="1"
          max="10"
          value={pasajeros}
          onChange={(e) => setPasajeros(parseInt(e.target.value))}
          required
        />

        <label>Precio total</label>
        <input type="text" value={`$${(precio * pasajeros).toLocaleString()}`} readOnly />

        <button type="submit" className="btn btn-green">
          Comprar
        </button>
      </form>

      <h3>Selecciona tus asientos</h3>
      <div className="legend">
        <div><span className="box disponible-box"></span> Disponible</div>
        <div><span className="box seleccionado-box"></span> Seleccionado</div>
        <div><span className="box ocupado-box"></span> Ocupado</div>
      </div>

      <div className="bus-layout">
        {asientos.map((fila, i) => (
          <div key={i} className="fila">
            <div className="columna">
              {fila.slice(0, 2).map((num) => (
                <div
                  key={num}
                  className={`seat ${
                    asientosOcupados.includes(num)
                      ? "ocupado"
                      : asientosSeleccionados.includes(num)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => toggleAsiento(num)}
                >
                  {num}
                </div>
              ))}
            </div>

            <div className="pasillo"></div>

            <div className="columna">
              {fila.slice(2, 4).map((num) => (
                <div
                  key={num}
                  className={`seat ${
                    asientosOcupados.includes(num)
                      ? "ocupado"
                      : asientosSeleccionados.includes(num)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => toggleAsiento(num)}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Compras;
