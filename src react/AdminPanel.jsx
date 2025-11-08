// AdminPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Estilos.css";
import qr from "qrcode";
import axios from "axios";
import { io } from "socket.io-client";

/*
  AdminPanel con:
  - Venta de tiquetes (asientos en tiempo real + PDF)
  - Historial (reimpresión)
  - Encomiendas integrado al servidor (POST/GET/PUT/DELETE)
*/

const API_BASE = "http://localhost:3000";
const socket = io(API_BASE, { autoConnect: true });

function AdminPanel() {
  const navigate = useNavigate();

  // ---------------------- Estados globales
  const [pestana, setPestana] = useState("venta");

  // ---- Venta
  const [nombreCliente, setNombreCliente] = useState("");
  const [cedulaCliente, setCedulaCliente] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [hora, setHora] = useState(""); // 24h
  const [fechaViaje, setFechaViaje] = useState("");
  const [precioNumber, setPrecioNumber] = useState(null);
  const [precio, setPrecio] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [asientosOcupadosVista, setAsientosOcupadosVista] = useState([]);
  const [tiqueteGenerado, setTiqueteGenerado] = useState(null);
  const [mostrarVolver, setMostrarVolver] = useState(false);
  const [referenciaCancelar, setReferenciaCancelar] = useState("");
  const [hoverInfo, setHoverInfo] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // ---- Encomiendas
  const [cedulaRemitente, setCedulaRemitente] = useState("");
  const [nombreRemitente, setNombreRemitente] = useState("");
  const [lugarRemitente, setLugarRemitente] = useState("");
  const [cedulaDestinatario, setCedulaDestinatario] = useState("");
  const [nombreDestinatario, setNombreDestinatario] = useState("");
  const [lugarEntrega, setLugarEntrega] = useState("");
  const [fechaEnvio, setFechaEnvio] = useState("");
  const [reclamado, setReclamado] = useState(false);
  const [encomiendas, setEncomiendas] = useState([]);
  const [cargandoEncomiendas, setCargandoEncomiendas] = useState(false);

  // ---- Ventas (historial / apoyo asientos)
  const [ventas, setVentas] = useState([]);

  const pollRef = useRef(null);

  // ---------------------- Datos rutas
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

  const formato12Horas = (h24) => {
    if (!h24) return "";
    const [h, m] = h24.split(":");
    const hi = parseInt(h, 10);
    const ampm = hi >= 12 ? "PM" : "AM";
    const h12 = hi % 12 === 0 ? 12 : hi % 12;
    return `${h12}:${m} ${ampm}`;
  };

  const formatCurrency = (num) =>
    typeof num === "number" && !isNaN(num) ? `$${num.toLocaleString("es-CO")}` : "";

  // ---------------------- Asientos (28 en matriz 4xN)
  const asientos = React.useMemo(() => {
    const total = 28;
    const filas = Math.ceil(total / 4);
    const m = [];
    let n = 1;
    for (let i = 0; i < filas; i++) {
      const fila = [];
      for (let j = 0; j < 4; j++) if (n <= total) fila.push(n++);
      m.push(fila);
    }
    return m;
  }, []);

  // ---------------------- Cargar ventas (para historial y ocupación)
  const fetchVentas = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/ventas`);
      const normal = data.map((v) => {
        try {
          return { ...v, asientos: typeof v.asientos === "string" ? JSON.parse(v.asientos) : v.asientos };
        } catch {
          return { ...v, asientos: v.asientos };
        }
      });
      setVentas(normal);
      localStorage.setItem("ventasTaquilla", JSON.stringify(normal));
    } catch (e) {
      const local = JSON.parse(localStorage.getItem("ventasTaquilla") || "[]");
      setVentas(local);
    }
  };

  // ---------------------- Ocupación
  const refetchOcupados = async () => {
    if (!origen || !destino || !hora || !fechaViaje) {
      setAsientosOcupadosVista([]);
      return;
    }
    try {
      const { data } = await axios.get(`${API_BASE}/api/asientos-ocupados`, {
        params: { origen, destino, hora, fecha: fechaViaje },
      });
      setAsientosOcupadosVista(Array.isArray(data?.ocupados) ? data.ocupados : []);
    } catch {
      // fallback con ventas locales
      const ocup = [];
      for (const v of ventas) {
        if (v.origen === origen && v.destino === destino && v.hora === hora && v.fecha === fechaViaje && Array.isArray(v.asientos)) {
          ocup.push(...v.asientos);
        }
      }
      setAsientosOcupadosVista([...new Set(ocup)]);
    }
  };

  // ---------------------- Encomiendas (servidor)
  const fetchEncomiendas = async () => {
    setCargandoEncomiendas(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/encomiendas`);
      setEncomiendas(data);
    } catch (e) {
      console.error("Error cargando encomiendas:", e);
    } finally {
      setCargandoEncomiendas(false);
    }
  };

  const handleAgregarEncomienda = async () => {
    if (
      !cedulaRemitente ||
      !nombreRemitente ||
      !lugarRemitente ||
      !cedulaDestinatario ||
      !nombreDestinatario ||
      !lugarEntrega ||
      !fechaEnvio
    ) {
      alert("Completa todos los campos de la encomienda");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/encomiendas`, {
        cedulaRemitente,
        nombreRemitente,
        lugarRemitente,
        cedulaDestinatario,
        nombreDestinatario,
        lugarEntrega,
        fechaEnvio,
        reclamado,
      });
      // limpiar
      setCedulaRemitente("");
      setNombreRemitente("");
      setLugarRemitente("");
      setCedulaDestinatario("");
      setNombreDestinatario("");
      setLugarEntrega("");
      setFechaEnvio("");
      setReclamado(false);
      await fetchEncomiendas();
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la encomienda en el servidor.");
    }
  };

  const toggleReclamado = async (id, current) => {
    try {
      await axios.put(`${API_BASE}/api/encomiendas/${id}`, { reclamado: !current });
      await fetchEncomiendas();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estado.");
    }
  };

  const eliminarEncomienda = async (id) => {
    if (!window.confirm("¿Eliminar la encomienda?")) return;
    try {
      await axios.delete(`${API_BASE}/api/encomiendas/${id}`);
      await fetchEncomiendas();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
    }
  };

  // ---------------------- Efectos
  useEffect(() => {
    fetchVentas();
    fetchEncomiendas();

    // sockets
    socket.on("nueva-compra", () => fetchVentas().then(refetchOcupados));
    socket.on("venta-eliminada", () => fetchVentas().then(refetchOcupados));

    socket.on("nueva-encomienda", fetchEncomiendas);
    socket.on("encomienda-actualizada", fetchEncomiendas);
    socket.on("encomienda-eliminada", fetchEncomiendas);

    return () => {
      socket.off("nueva-compra");
      socket.off("venta-eliminada");
      socket.off("nueva-encomienda");
      socket.off("encomienda-actualizada");
      socket.off("encomienda-eliminada");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refetchOcupados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen, destino, hora, fechaViaje, ventas]);

  useEffect(() => {
    const key = `${origen}→${destino}`;
    if (origen && destino && origen !== destino && rutas[key]) {
      setPrecioNumber(rutas[key].precio);
      setPrecio(formatCurrency(rutas[key].precio));
      setHorariosDisponibles(rutas[key].horarios);
    } else {
      setPrecioNumber(null);
      setPrecio("");
      setHorariosDisponibles([]);
    }
    setHora("");
    setAsientosSeleccionados([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen, destino]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (!document.hidden && pestana === "venta") fetchVentas().then(refetchOcupados);
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana, origen, destino, hora, fechaViaje]);

  useEffect(() => {
    if (pestana === "venta") {
      pollRef.current = setInterval(() => fetchVentas().then(refetchOcupados), 5000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana, origen, destino, hora, fechaViaje]);

  // ---------------------- Acciones venta
  const toggleAsiento = (num) => {
    if (asientosOcupadosVista.includes(num)) {
      alert(`El asiento ${num} ya está ocupado para esa ruta/hora/fecha.`);
      return;
    }
    setAsientosSeleccionados((prev) => {
      if (prev.includes(num)) return prev.filter((a) => a !== num);
      if (prev.length >= pasajeros) return [...prev.slice(1), num];
      return [...prev, num];
    });
  };

  const getInfoAsiento = (num) => {
    const v = ventas.find(
      (x) =>
        x.origen === origen &&
        x.destino === destino &&
        x.hora === hora &&
        x.fecha === fechaViaje &&
        Array.isArray(x.asientos) &&
        x.asientos.includes(num)
    );
    if (!v) return "";
    return `Nombre: ${v.comprador}\nDocumento: ${v.documento}\nTiquete: ${v.referencia}`;
  };

  const handleSubmitVenta = async (e) => {
    e.preventDefault();
    if (!nombreCliente || !cedulaCliente || !origen || !destino || !hora || !fechaViaje || asientosSeleccionados.length === 0) {
      alert("Completa todos los campos y selecciona al menos un asiento.");
      return;
    }
    // Validar ocupación en servidor
    try {
      const { data } = await axios.get(`${API_BASE}/api/asientos-ocupados`, {
        params: { origen, destino, hora, fecha: fechaViaje },
      });
      const ocup = new Set(data?.ocupados || []);
      const choque = asientosSeleccionados.filter((n) => ocup.has(n));
      if (choque.length) {
        alert(`Asientos ya ocupados: ${choque.join(", ")}`);
        await fetchVentas();
        await refetchOcupados();
        return;
      }
    } catch (e) {
      console.warn("No se pudo validar en backend; continúo con respaldo local.");
    }

    const referencia = "TKT-" + Date.now().toString().slice(-6);
    const fechaCompra = new Date().toISOString().split("T")[0];
    const horaCompra = new Date().toTimeString().split(" ")[0];

    const tiquete = {
      comprador: nombreCliente,
      documento: cedulaCliente,
      origen,
      destino,
      hora,
      fecha: fechaViaje,
      pasajeros,
      asientos: asientosSeleccionados,
      precio: precioNumber,
      referencia,
      fechaCompra,
      horaCompra,
      modoPago: "Efectivo (Taquilla)",
    };

    try {
      const res = await axios.post(`${API_BASE}/api/ventas`, {
        usuario_id: null,
        referencia: tiquete.referencia,
        comprador: tiquete.comprador,
        documento: tiquete.documento,
        origen: tiquete.origen,
        destino: tiquete.destino,
        hora: tiquete.hora,
        asientos: tiquete.asientos,
        precio: tiquete.precio,
        fecha: tiquete.fecha,
        fechaCompra: tiquete.fechaCompra,
        horaCompra: tiquete.horaCompra,
        modoPago: tiquete.modoPago,
        pasajeros: tiquete.pasajeros,
      });

      const guardada = res.data?.compra || tiquete;
      if (typeof guardada.asientos === "string") {
        try {
          guardada.asientos = JSON.parse(guardada.asientos);
        } catch {}
      }

      await fetchVentas();
      await refetchOcupados();
      setTiqueteGenerado(guardada);
      setMostrarVolver(true);
      setTimeout(() => descargarPDF(guardada), 300);
    } catch (err) {
      console.error("Fallo servidor, guardo local:", err);
      const local = { id: Date.now(), ...tiquete };
      const updated = [local, ...ventas];
      setVentas(updated);
      localStorage.setItem("ventasTaquilla", JSON.stringify(updated));
      setTiqueteGenerado(local);
      setMostrarVolver(true);
      setTimeout(() => descargarPDF(local), 300);
    }
  };

  const descargarPDF = (tiq) => {
    const nodo = document.createElement("div");
    nodo.style.padding = "20px";
    nodo.style.width = "700px";
    nodo.style.background = "white";

    const horaMostrar = tiq.hora ? formato12Horas(tiq.hora) : tiq.hora;
    const precioMostrar = typeof tiq.precio === "number" ? formatCurrency(tiq.precio) : tiq.precio;

    nodo.innerHTML = `
      <div style="position:relative;padding:20px;">
        <img src="https://buscobus.com.co/wp-content/uploads/2017/05/coonorte.jpg"
          style="position:absolute;top:20px;left:50%;transform:translateX(-50%);width:250px;opacity:0.15;" />
        <div style="text-align:center;margin-bottom:40px;position:relative;">
          <h1>Factura de Venta - Taquilla</h1>
          <p><strong>Referencia:</strong> ${tiq.referencia}</p>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <div style="flex:1;margin-right:20px;">
            <h3>Datos del Pasajero</h3>
            <p><strong>Nombre:</strong> ${tiq.comprador}</p>
            <p><strong>Cédula:</strong> ${tiq.documento}</p>
            <p><strong>Pasajeros:</strong> ${tiq.pasajeros}</p>
            <p><strong>Asientos:</strong> ${Array.isArray(tiq.asientos) ? tiq.asientos.join(", ") : tiq.asientos}</p>
            <h3>Viaje</h3>
            <p><strong>Origen:</strong> ${tiq.origen}</p>
            <p><strong>Destino:</strong> ${tiq.destino}</p>
            <p><strong>Fecha:</strong> ${tiq.fecha}</p>
            <p><strong>Hora:</strong> ${horaMostrar}</p>
            <h3>Compra</h3>
            <p><strong>Fecha compra:</strong> ${tiq.fechaCompra}</p>
            <p><strong>Hora compra:</strong> ${tiq.horaCompra}</p>
            <p><strong>Modo de pago:</strong> ${tiq.modoPago}</p>
            <p><strong>Precio:</strong> ${precioMostrar}</p>
          </div>
          <div style="text-align:center;">
            <canvas id="qrCanvas"></canvas>
            <p style="font-size:14px;">Escanee el código QR</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(nodo);
    const canvasQR = nodo.querySelector("#qrCanvas");
    try {
      qr.toCanvas(canvasQR, `https://coonorte.com/verificar/${tiq.referencia}`);
    } catch {}
    html2canvas(nodo).then((canvas) => {
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`Factura_${tiq.referencia}.pdf`);
      document.body.removeChild(nodo);
    });
  };

  const limpiarFormulario = () => {
    setNombreCliente("");
    setCedulaCliente("");
    setOrigen("");
    setDestino("");
    setHora("");
    setFechaViaje("");
    setPrecioNumber(null);
    setPrecio("");
    setPasajeros(1);
    setHorariosDisponibles([]);
    setAsientosSeleccionados([]);
    setTiqueteGenerado(null);
    setMostrarVolver(false);
    setAsientosOcupadosVista([]);
  };

  const handleCancelarTiquete = async () => {
    if (!referenciaCancelar) return alert("Ingresa la referencia a cancelar");
    try {
      const { data } = await axios.get(`${API_BASE}/api/ventas`);
      const venta = data.find((v) => v.referencia === referenciaCancelar);
      if (venta?.id) {
        await axios.delete(`${API_BASE}/api/ventas/${venta.id}`);
        await fetchVentas();
        await refetchOcupados();
        alert(`Tiquete ${referenciaCancelar} cancelado.`);
        setReferenciaCancelar("");
        return;
      }
    } catch (e) {
      console.warn("No se pudo eliminar en servidor; intento local.");
    }
    // fallback local
    const lista = JSON.parse(localStorage.getItem("ventasTaquilla") || "[]");
    const idx = lista.findIndex((v) => v.referencia === referenciaCancelar);
    if (idx === -1) return alert("No se encontró el tiquete.");
    const eliminado = lista.splice(idx, 1)[0];
    localStorage.setItem("ventasTaquilla", JSON.stringify(lista));
    setVentas(lista);
    await refetchOcupados();
    alert(
      `Tiquete ${referenciaCancelar} cancelado. Asientos liberados: ${
        Array.isArray(eliminado.asientos) ? eliminado.asientos.join(", ") : eliminado.asientos
      }`
    );
    setReferenciaCancelar("");
  };

  // ---------------------- Agrupar ventas por fechaCompra (historial)
  const ventasPorFecha = React.useMemo(() => {
    const g = {};
    ventas.forEach((v) => {
      const key = v.fechaCompra || "Sin fecha";
      if (!g[key]) g[key] = [];
      g[key].push(v);
    });
    return g;
  }, [ventas]);

  // ---------------------- RENDERS
  const renderVenta = () => (
    <div className="seccion" style={{ marginBottom: 40 }}>
      <h3>Venta de Tiquetes</h3>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Referencia TKT-XXXXXX"
          value={referenciaCancelar}
          onChange={(e) => setReferenciaCancelar(e.target.value)}
        />
        <button className="btn btn-red" onClick={handleCancelarTiquete}>
          Cancelar Tiquete
        </button>
        <button
          className="btn btn-blue"
          style={{ marginLeft: 8 }}
          onClick={() => fetchVentas().then(refetchOcupados)}
        >
          Refrescar asientos
        </button>
      </div>

      {!tiqueteGenerado ? (
        <>
          <form className="form" onSubmit={handleSubmitVenta}>
            <label>Nombre del cliente</label>
            <input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} required />

            <label>Cédula del cliente</label>
            <input value={cedulaCliente} onChange={(e) => setCedulaCliente(e.target.value)} required />

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
              {(horariosDisponibles || []).map((h) => (
                <option key={h} value={h}>
                  {formato12Horas(h)}
                </option>
              ))}
            </select>

            <label>Fecha del viaje</label>
            <input type="date" value={fechaViaje} onChange={(e) => setFechaViaje(e.target.value)} required />

            <label>Precio</label>
            <input value={precio} readOnly />

            <label>Número de pasajeros</label>
            <input
              type="number"
              min="1"
              max="10"
              value={pasajeros}
              onChange={(e) => setPasajeros(parseInt(e.target.value, 10) || 1)}
              required
            />

            <button type="submit" className="btn btn-green">Generar tiquete y descargar PDF</button>
            <button
              type="button"
              className="btn btn-gray"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setAsientosSeleccionados([]);
                fetchVentas().then(refetchOcupados);
              }}
            >
              Limpiar selección
            </button>
          </form>

          <h3 style={{ marginTop: 24 }}>Selecciona asientos</h3>
          <div className="bus">
            {asientos.map((fila, i) => (
              <div key={i} className="fila">
                {fila.map((num) => {
                  const ocupado = asientosOcupadosVista.includes(num);
                  const seleccionado = asientosSeleccionados.includes(num);
                  return (
                    <div
                      key={num}
                      className={`asiento ${ocupado ? "ocupado" : seleccionado ? "seleccionado" : ""}`}
                      onClick={() => toggleAsiento(num)}
                      onMouseEnter={(e) => {
                        setHoverInfo(getInfoAsiento(num));
                        setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoverInfo("")}
                      title={ocupado ? "Ocupado" : seleccionado ? "Seleccionado" : "Disponible"}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: 20 }}>Leyenda de Asientos</h4>
          <div className="leyenda" style={{ display: "flex", gap: "20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 20, height: 20, backgroundColor: "red", border: "1px solid #000" }} />
              <span>Ocupado</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 20, height: 20, backgroundColor: "yellow", border: "1px solid #000" }} />
              <span>Seleccionado</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 20, height: 20, backgroundColor: "green", border: "1px solid #000" }} />
              <span>Disponible</span>
            </div>
          </div>

          {hoverInfo && (
            <div
              className="tooltip"
              style={{ position: "fixed", top: tooltipPos.y + 10, left: tooltipPos.x + 10, whiteSpace: "pre-line", zIndex: 1000 }}
            >
              {hoverInfo}
            </div>
          )}
        </>
      ) : (
        <div>
          <p>Tiquete generado correctamente: {tiqueteGenerado.referencia}</p>
          {mostrarVolver && (
            <button className="btn btn-blue" onClick={limpiarFormulario}>
              Volver a generar
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderHistorial = () => (
    <div className="seccion">
      <h3>Historial de ventas</h3>
      {Object.keys(ventasPorFecha)
        .sort((a, b) => b.localeCompare(a))
        .map((f) => (
          <div key={f} style={{ marginBottom: 20 }}>
            <h4>{f}</h4>
            <table className="table">
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
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventasPorFecha[f].map((v) => (
                  <tr key={v.referencia}>
                    <td>{v.referencia}</td>
                    <td>{v.comprador}</td>
                    <td>{v.documento}</td>
                    <td>{v.origen}</td>
                    <td>{v.destino}</td>
                    <td>{v.hora ? formato12Horas(v.hora) : v.hora}</td>
                    <td>{Array.isArray(v.asientos) ? v.asientos.join(", ") : v.asientos}</td>
                    <td>{typeof v.precio === "number" ? formatCurrency(v.precio) : v.precio}</td>
                    <td>
                      <button className="btn btn-blue" onClick={() => descargarPDF(v)}>
                        Reimprimir PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );

  const renderEncomiendas = () => (
    <div className="seccion">
      <h3>Encomiendas</h3>

      <div className="form-encomienda">
        <input placeholder="Cédula Remitente" value={cedulaRemitente} onChange={(e) => setCedulaRemitente(e.target.value)} />
        <input placeholder="Nombre Remitente" value={nombreRemitente} onChange={(e) => setNombreRemitente(e.target.value)} />
        <input placeholder="Lugar de donde envían" value={lugarRemitente} onChange={(e) => setLugarRemitente(e.target.value)} />
        <input placeholder="Cédula Destinatario" value={cedulaDestinatario} onChange={(e) => setCedulaDestinatario(e.target.value)} />
        <input placeholder="Nombre Destinatario" value={nombreDestinatario} onChange={(e) => setNombreDestinatario(e.target.value)} />
        <input placeholder="Lugar de entrega" value={lugarEntrega} onChange={(e) => setLugarEntrega(e.target.value)} />
        <input type="date" value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} />

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Reclamado
          <input type="checkbox" checked={reclamado} onChange={(e) => setReclamado(e.target.checked)} />
        </label>

        <button className="btn btn-green" onClick={handleAgregarEncomienda}>
          Agregar Encomienda
        </button>
        <button className="btn btn-blue" style={{ marginLeft: 8 }} onClick={fetchEncomiendas}>
          Refrescar
        </button>
      </div>

      {cargandoEncomiendas ? (
        <p style={{ marginTop: 16 }}>Cargando…</p>
      ) : (
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Remitente</th>
              <th>Lugar Remitente</th>
              <th>Destinatario</th>
              <th>Lugar Entrega</th>
              <th>Fecha Envío</th>
              <th>Reclamado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {encomiendas.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.nombreRemitente} ({e.cedulaRemitente})</td>
                <td>{e.lugarRemitente}</td>
                <td>{e.nombreDestinatario} ({e.cedulaDestinatario})</td>
                <td>{e.lugarEntrega}</td>
                <td>{e.fechaEnvio}</td>
                <td>
                  <input type="checkbox" checked={!!e.reclamado} onChange={() => toggleReclamado(e.id, !!e.reclamado)} />
                </td>
                <td>
                  <button className="btn btn-red" onClick={() => eliminarEncomienda(e.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ---------------------- Render principal
  return (
    <div className="container">
      <h2>Panel Administrativo - Taquilla</h2>

      <div style={{ marginBottom: 20 }}>
        <button className={pestana === "venta" ? "active" : ""} onClick={() => setPestana("venta")}>
          Venta Tiquetes
        </button>
        <button className={pestana === "historial" ? "active" : ""} onClick={() => setPestana("historial")}>
          Historial
        </button>
        <button className={pestana === "encomiendas" ? "active" : ""} onClick={() => setPestana("encomiendas")}>
          Encomiendas
        </button>
      </div>

      {pestana === "venta" && renderVenta()}
      {pestana === "historial" && renderHistorial()}
      {pestana === "encomiendas" && renderEncomiendas()}
    </div>
  );
}

export default AdminPanel;
