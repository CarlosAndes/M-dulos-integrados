import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Estilos.css";

const API = "http://localhost:3000";

const Recuperar = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const navigate = useNavigate();

  /* --------------------------
        Paso 1: enviar código
  ---------------------------*/
  const sendCode = async (e) => {
    e.preventDefault();

    try {
      const resp = await fetch(`${API}/api/recuperar/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.mensaje);
        return;
      }

      alert(`Código enviado a ${email}: ${data.codigo}`);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Error enviando el código.");
    }
  };

  /* --------------------------
       Paso 2: validar código
  ---------------------------*/
  const verifyCode = async (e) => {
    e.preventDefault();

    try {
      const resp = await fetch(`${API}/api/recuperar/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.mensaje);
        return;
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Error validando el código.");
    }
  };

  /* --------------------------
   Paso 3: cambiar contraseña
  ---------------------------*/
  const changePassword = async (e) => {
    e.preventDefault();

    if (newPass !== confirmPass) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      const resp = await fetch(`${API}/api/recuperar/cambiar-pass`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPass }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.mensaje);
        return;
      }

      alert("✅ Contraseña actualizada. Ahora inicia sesión.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error cambiando la contraseña.");
    }
  };

  return (
    <div className="container recuperar-container">
      <h2>Recuperar Contraseña</h2>

      {/* ---------- PASO 1 ---------- */}
      {step === 1 && (
        <form onSubmit={sendCode} className="form">
          <label>Correo registrado</label>
          <input
            type="email"
            placeholder="Tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn btn-green">Enviar código</button>
        </form>
      )}

      {/* ---------- PASO 2 ---------- */}
      {step === 2 && (
        <form onSubmit={verifyCode} className="form">
          <label>Código enviado a tu correo</label>
          <input
            type="text"
            placeholder="Ingresa el código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <button className="btn btn-green">Verificar código</button>
        </form>
      )}

      {/* ---------- PASO 3 ---------- */}
      {step === 3 && (
        <form onSubmit={changePassword} className="form">
          <label>Nueva contraseña</label>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />

          <label>Confirmar contraseña</label>
          <input
            type="password"
            placeholder="Repite la contraseña"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />

          <button className="btn btn-green">Cambiar contraseña</button>
        </form>
      )}

      <p><a href="/">Volver al login</a></p>
    </div>
  );
};

export default Recuperar;
