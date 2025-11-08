import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Estilos.css";

const API = "http://localhost:3000";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const mustLogin = new URLSearchParams(location.search).get("mustLogin") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.trim() || !pass.trim()) {
      alert("❌ Por favor llena todos los campos");
      return;
    }

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Guarda cookie de sesión
        body: JSON.stringify({ user, pass })
      });

      const data = await res.json();

      if (!res.ok) {
        alert("❌ " + (data.mensaje || "Usuario o contraseña incorrectos"));
        return;
      }

      alert(`✅ Bienvenido, ${data.usuario.nombre}`);

      // ✅ Guardar sesión localmente (requerido por Menu)
      localStorage.setItem("usuarioLogueado", data.usuario.nombre);
      localStorage.setItem("usuarioLogueadoEmail", data.usuario.email);

      // ✅ ADMIN
      if (data.usuario.email === "taquilla.coonorte@gmail.com") {
        navigate("/admin");
        return;
      }

      // ✅ USUARIO NORMAL
      navigate("/menu");

    } catch (error) {
      console.error(error);
      alert("❌ No se pudo conectar con el servidor.");
    }
  };

  const toggleMenu = () => {
    const nav = document.getElementById("navMenu");
    if (nav) nav.classList.toggle("show");
  };

  return (
    <div className="login-page">

      <header className="header">
        <div className="header-container">
          <img
            src="https://buscobus.com.co/wp-content/uploads/2017/05/coonorte.jpg"
            alt="Logo Coonorte"
            className="logo"
          />
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
        </div>

        <nav className="nav" id="navMenu">
          <button onClick={() => navigate("/")} className="link-btn">Login</button>
          <button onClick={() => navigate("/registro")} className="link-btn">Registro</button>
          <button onClick={() => navigate("/contacto")} className="link-btn">Contacto</button>
          <button onClick={() => navigate("/compras?mustLogin=1")} className="link-btn">Compra</button>
        </nav>
      </header>

      {mustLogin && (
        <div
          style={{
            background: "#ffe5e5",
            padding: "10px",
            margin: "15px auto",
            width: "90%",
            maxWidth: "400px",
            textAlign: "center",
            borderRadius: "8px",
            color: "#b40000",
            fontWeight: "bold"
          }}
        >
          Debes iniciar sesión para acceder a Compras.
        </div>
      )}

      <main className="login-wrapper">
        <div className="login-card">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShmTODXOIyFWmyEpjdxLzTiAyzdfQEWmOGNA&s"
            alt="Bus Coonorte"
            className="login-image"
          />

          <h2>Iniciar Sesión</h2>

          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="user">Correo o Nombre</label>
            <input
              id="user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Ingresa tu correo o nombre"
              required
            />

            <label htmlFor="pass">Contraseña</label>
            <input
              id="pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="********"
              required
            />

            <button type="submit" className="btn btn-green full-width">
              Ingresar
            </button>

            <button
              className="forgot-pass"
              type="button"
              onClick={() => navigate("/recuperar")}
            >
              ¿Olvidaste tu contraseña?
            </button>

            <p>
              ¿No tienes cuenta?
              <button
                type="button"
                className="link-btn-mini"
                onClick={() => navigate("/registro")}
              >
                Regístrate aquí
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
