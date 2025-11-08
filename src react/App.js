import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Registro from "./Registro";
import Recuperar from "./Recuperar";
import Menu from "./Menu";
import Compras from "./Compras";
import Pago from "./Pago";
import Factura from "./Factura";
import Verificar from "./Verificar";
import Contacto from "./Contacto";
import AdminPanel from "./AdminPanel";
import Dashboard from "./Dashboard";
import EncomiendasUsuario from "./EncomiendasUsuario";

import "./Estilos.css";

const API = "http://localhost:3000";

/* ============================================================
   ✅ PrivateRoute OPTIMIZADO (rápido y compatible con cookies)
=============================================================== */
const PrivateRoute = ({ children }) => {
  const [auth, setAuth] = useState({ loading: true, user: null });

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setAuth({
          loading: false,
          user: data.autenticado ? data.user : null,
        });
      })
      .catch(() => setAuth({ loading: false, user: null }));
  }, []);

  if (auth.loading) return <div style={{ padding: 20 }}>Cargando...</div>;
  return auth.user ? children : <Navigate to="/" replace />;
};

/* ============================================================
   ✅ AdminRoute (solo correo autorizado)
=============================================================== */
const AdminRoute = ({ children }) => {
  const [auth, setAuth] = useState({ loading: true, user: null });

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setAuth({
          loading: false,
          user: data.autenticado ? data.user : null,
        });
      })
      .catch(() => setAuth({ loading: false, user: null }));
  }, []);

  if (auth.loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  return auth.user?.email === "taquilla.coonorte@gmail.com"
    ? children
    : <Navigate to="/" replace />;
};

/* ============================================================
   ✅ APP PRINCIPAL
=============================================================== */
export default function App() {
  return (
    <Router>
      <Routes>
        
        {/* 📌 Rutas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/contacto" element={<Contacto />} />

        {/* 📌 Rutas Privadas (requieren login) */}
        <Route
          path="/menu"
          element={
            <PrivateRoute>
              <Menu />
            </PrivateRoute>
          }
        />

        <Route
          path="/compras"
          element={
            <PrivateRoute>
              <Compras />
            </PrivateRoute>
          }
        />

        <Route
          path="/pago"
          element={
            <PrivateRoute>
              <Pago />
            </PrivateRoute>
          }
        />

        <Route
          path="/factura"
          element={
            <PrivateRoute>
              <Factura />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/encomiendas"
          element={
            <PrivateRoute>
              <EncomiendasUsuario />
            </PrivateRoute>
          }
        />

        {/* 📌 Ruta para revisar compras con código */}
        <Route path="/verificar/:referencia" element={<Verificar />} />

        {/* 📌 ADMIN (solo taquilla) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        {/* 📌 Cualquier otra ruta: Redirige a Login */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}
