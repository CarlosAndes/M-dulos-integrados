import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Estilos.css";

const Registro = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !email || !documento || !password || !confirm) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, documento, password }), // coincide con tu API
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Registro exitoso como ${data.rol}.`);
        navigate("/"); // redirige al login
      } else {
        alert(data.mensaje || "Error al registrar el usuario.");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("❌ No se pudo conectar con el servidor.");
    }
  };

  const toggleMenu = () => {
    const nav = document.getElementById("navMenu");
    nav.classList.toggle("show");
  };

  return (
    <div>
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
          <a href="/">Login</a>
          <a href="/registro" className="active">Registro</a>
          <a href="/contacto">Contacto</a>
        </nav>
      </header>

      <main className="container">
        <section className="registro-section">
          <h2>Registro de Usuario</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="nombre">Nombre y Apellidos</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              required
            />

            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />

            <label htmlFor="documento">Número de Documento</label>
            <input
              type="text"
              id="documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ingresa tu número de cédula"
              required
            />

            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />

            <label htmlFor="confirm">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="********"
              required
            />

            <button type="submit" className="btn btn-blue">Registrarse</button>
            <p>¿Ya tienes cuenta? <a href="/">Inicia sesión</a></p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Registro;
