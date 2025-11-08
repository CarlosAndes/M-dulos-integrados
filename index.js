import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import conexion from "./db.js";

const app = express();

/* ======================================================
   ✅ CONFIGURACIÓN CORS
====================================================== */
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ❌ IMPORTANTE: ESTA LÍNEA ESTABA ROMPIENDO TODO
// app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

/* ======================================================
   ✅ HEALTHCHECK
====================================================== */
app.get("/", (req, res) => res.json({ ok: true }));

/* ======================================================
   ✅ SERVIDOR HTTP + SOCKET
====================================================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

/* ======================================================
   ✅ HELPERS
====================================================== */
const roomKey = (o, d, h, f) => `${o}|${d}|${h}|${f}`;

async function broadcastOcupados(origen, destino, hora, fecha) {
  try {
    const [rows] = await conexion.execute(
      "SELECT asientos FROM ventas WHERE origen = ? AND destino = ? AND hora = ? AND fecha = ?",
      [origen, destino, hora, fecha]
    );

    const ocupados = [];
    for (const r of rows) {
      try {
        JSON.parse(r.asientos).forEach(n => ocupados.push(Number(n)));
      } catch {}
    }

    io.to(roomKey(origen, destino, hora, fecha)).emit("ocupacion-actualizada", {
      origen,
      destino,
      hora,
      fecha,
      ocupados: [...new Set(ocupados)]
    });

  } catch (err) {
    console.error("broadcastOcupados error:", err);
  }
}

/* ======================================================
   ✅ LOGIN REAL CON COOKIES
====================================================== */
app.post("/api/login", async (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass)
    return res.status(400).json({ mensaje: "Debe enviar usuario y contraseña" });

  try {
    const [rows] = await conexion.execute(
      "SELECT * FROM usuarios WHERE email = ? OR nombre = ?",
      [user, user]
    );

    if (!rows.length)
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });

    const usuario = rows[0];

    const ok = await bcrypt.compare(pass, usuario.password);
    if (!ok)
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });

    res.cookie("sessionUser", usuario.id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        documento: usuario.documento,
        rol: usuario.rol || "usuario",
      }
    });

  } catch (e) {
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

/* ======================================================
   ✅ LOGOUT
====================================================== */
app.post("/api/logout", (req, res) => {
  res.clearCookie("sessionUser");
  res.json({ mensaje: "Sesión cerrada" });
});

/* ======================================================
   ✅ VERIFICAR SESIÓN
====================================================== */
app.get("/api/auth/me", async (req, res) => {
  const uid = req.cookies.sessionUser;

  if (!uid)
    return res.status(401).json({ autenticado: false });

  const [rows] = await conexion.execute(
    "SELECT id, nombre, email, documento, rol FROM usuarios WHERE id = ?",
    [uid]
  );

  if (!rows.length)
    return res.status(401).json({ autenticado: false });

  res.json({ autenticado: true, user: rows[0] });
});

/* ======================================================
   ✅ REGISTRO
====================================================== */
app.post("/api/registro", async (req, res) => {
  const { nombre, email, documento, password } = req.body;

  if (!nombre || !email || !documento || !password)
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });

  try {
    const hashed = await bcrypt.hash(password, 10);

    await conexion.execute(
      "INSERT INTO usuarios (nombre, email, documento, password) VALUES (?, ?, ?, ?)",
      [nombre, email, documento, hashed]
    );

    res.json({ mensaje: "Usuario registrado correctamente" });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(400).json({ mensaje: "El correo ya existe" });

    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
});

/* ======================================================
   ✅ RECUPERAR CONTRASEÑA
====================================================== */
app.post("/api/recuperar/enviar-codigo", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ mensaje: "Debe enviar el correo" });

  try {
    const [rows] = await conexion.execute(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ mensaje: "Correo no encontrado" });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 10 * 60000);

    await conexion.execute(
      "UPDATE usuarios SET codigoRecuperacion = ?, expiraCodigo = ? WHERE email = ?",
      [codigo, expira, email]
    );

    res.json({ mensaje: "Código enviado", codigo });

  } catch (e) {
    res.status(500).json({ mensaje: "Error generando código" });
  }
});

app.post("/api/recuperar/verificar-codigo", async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo)
    return res.status(400).json({ mensaje: "Faltan datos" });

  try {
    const [rows] = await conexion.execute(
      "SELECT codigoRecuperacion, expiraCodigo FROM usuarios WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ mensaje: "Correo no encontrado" });

    const user = rows[0];

    if (user.codigoRecuperacion !== codigo)
      return res.status(400).json({ mensaje: "Código incorrecto" });

    if (new Date() > new Date(user.expiraCodigo))
      return res.status(400).json({ mensaje: "El código expiró" });

    res.json({ mensaje: "Código correcto" });

  } catch (e) {
    res.status(500).json({ mensaje: "Error verificando código" });
  }
});

app.put("/api/recuperar/cambiar-pass", async (req, res) => {
  const { email, newPass } = req.body;

  if (!email || !newPass)
    return res.status(400).json({ mensaje: "Faltan datos" });

  try {
    const hashed = await bcrypt.hash(newPass, 10);

    await conexion.execute(
      "UPDATE usuarios SET password = ?, codigoRecuperacion = NULL, expiraCodigo = NULL WHERE email = ?",
      [hashed, email]
    );

    res.json({ mensaje: "Contraseña cambiada" });

  } catch (e) {
    res.status(500).json({ mensaje: "Error actualizando contraseña" });
  }
});

/* ======================================================
   ✅ ENCOMIENDAS
====================================================== */
app.post("/api/encomiendas", async (req, res) => {
  const {
    cedulaRemitente, nombreRemitente, lugarRemitente,
    cedulaDestinatario, nombreDestinatario, lugarEntrega,
    fechaEnvio, reclamado
  } = req.body;

  if (!cedulaRemitente || !nombreRemitente || !lugarRemitente ||
      !cedulaDestinatario || !nombreDestinatario ||
      !lugarEntrega || !fechaEnvio)
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });

  try {
    const [result] = await conexion.execute(
      `INSERT INTO encomiendas
       (cedulaRemitente,nombreRemitente,lugarRemitente,
        cedulaDestinatario,nombreDestinatario,lugarEntrega,
        fechaEnvio,reclamado)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        cedulaRemitente, nombreRemitente, lugarRemitente,
        cedulaDestinatario, nombreDestinatario, lugarEntrega,
        fechaEnvio, reclamado ? 1 : 0
      ]
    );

    res.json({ mensaje: "Encomienda registrada", id: result.insertId });

  } catch (err) {
    res.status(500).json({ mensaje: "Error registrando encomienda" });
  }
});

app.get("/api/encomiendas", async (req, res) => {
  const { cedula } = req.query;

  try {
    let query = "SELECT * FROM encomiendas";
    let params = [];

    if (cedula) {
      query += " WHERE cedulaRemitente = ? OR cedulaDestinatario = ?";
      params = [cedula, cedula];
    }

    const [rows] = await conexion.execute(query, params);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ mensaje: "Error consultando encomiendas" });
  }
});

app.put("/api/encomiendas/:id", async (req, res) => {
  const { id } = req.params;
  const { reclamado } = req.body;

  try {
    await conexion.execute(
      "UPDATE encomiendas SET reclamado = ? WHERE id = ?",
      [reclamado ? 1 : 0, id]
    );

    res.json({ mensaje: "Estado actualizado" });

  } catch (err) {
    res.status(500).json({ mensaje: "Error actualizando encomienda" });
  }
});

app.delete("/api/encomiendas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await conexion.execute("DELETE FROM encomiendas WHERE id = ?", [id]);
    res.json({ mensaje: "Encomienda eliminada" });

  } catch (err) {
    res.status(500).json({ mensaje: "Error eliminando encomienda" });
  }
});

/* ======================================================
   ✅ ASIENTOS OCUPADOS
====================================================== */
app.get("/api/asientos-ocupados", async (req, res) => {
  const { origen, destino, hora, fecha } = req.query;

  if (!origen || !destino || !hora || !fecha)
    return res.status(400).json({ mensaje: "Faltan parámetros" });

  try {
    const [rows] = await conexion.execute(
      "SELECT asientos FROM ventas WHERE origen = ? AND destino = ? AND hora = ? AND fecha = ?",
      [origen, destino, hora, fecha]
    );

    const ocupados = [];
    for (const r of rows) {
      try {
        JSON.parse(r.asientos).forEach(n => ocupados.push(Number(n)));
      } catch {}
    }

    res.json({ ocupados: [...new Set(ocupados)] });

  } catch (err) {
    res.status(500).json({ mensaje: "Error obteniendo ocupados" });
  }
});

/* ======================================================
   ✅ VENTAS
====================================================== */
app.post("/api/ventas", async (req, res) => {
  const {
    usuario_id, referencia, comprador, documento,
    origen, destino, hora, fecha, asientos,
    precio, pasajeros, fechaCompra, horaCompra, modoPago
  } = req.body;

  if (!referencia || !comprador || !documento ||
      !origen || !destino || !hora || !fecha ||
      !asientos || !precio || !pasajeros)
    return res.status(400).json({ mensaje: "Datos incompletos" });

  try {
    const [result] = await conexion.execute(
      `INSERT INTO ventas 
      (usuario_id, referencia, comprador, documento, origen, destino, hora, fecha,
       asientos, precio, pasajeros, fechaCompra, horaCompra, modoPago)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id || null, referencia, comprador, documento,
        origen, destino, hora, fecha,
        JSON.stringify(asientos), precio, pasajeros,
        fechaCompra, horaCompra, modoPago
      ]
    );

    broadcastOcupados(origen, destino, hora, fecha);

    res.json({ mensaje: "Venta registrada", id: result.insertId });

  } catch (err) {
    res.status(500).json({ mensaje: "Error registrando venta" });
  }
});

app.get("/api/ventas", async (req, res) => {
  const { referencia } = req.query;

  try {
    let query = "SELECT * FROM ventas";
    const params = [];

    if (referencia) {
      query += " WHERE referencia = ?";
      params.push(referencia);
    }

    const [rows] = await conexion.execute(query, params);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ mensaje: "Error consultando ventas" });
  }
});

app.delete("/api/ventas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await conexion.execute("DELETE FROM ventas WHERE id = ?", [id]);
    res.json({ mensaje: "Venta eliminada" });

  } catch (err) {
    res.status(500).json({ mensaje: "Error eliminando venta" });
  }
});

/* ======================================================
   ✅ SOCKET.IO
====================================================== */
io.on("connection", (socket) => {
  socket.on("suscribirse-viaje", async ({ origen, destino, hora, fecha }) => {
    if (!origen || !destino || !hora || !fecha) return;

    socket.join(roomKey(origen, destino, hora, fecha));

    try {
      const [rows] = await conexion.execute(
        "SELECT asientos FROM ventas WHERE origen = ? AND destino = ? AND hora = ? AND fecha = ?",
        [origen, destino, hora, fecha]
      );

      const ocupados = [];
      for (const r of rows) {
        try {
          JSON.parse(r.asientos).forEach(n => ocupados.push(Number(n)));
        } catch {}
      }

      socket.emit("ocupacion-actualizada", {
        origen, destino, hora, fecha,
        ocupados: [...new Set(ocupados)]
      });

    } catch (err) {
      console.error("snapshot error:", err);
    }
  });

  socket.on("desuscribirse-viaje", ({ origen, destino, hora, fecha }) => {
    socket.leave(roomKey(origen, destino, hora, fecha));
  });
});

/* ======================================================
   ✅ RUTA 404
====================================================== */
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

/* ======================================================
   ✅ INICIAR SERVIDOR
====================================================== */
server.listen(3000, () => {
  console.log("✅ Servidor corriendo en http://localhost:3000");
});
