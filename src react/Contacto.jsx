import React from "react";
import "./Estilos.css";

const Contacto = () => {
  return (
    <div>
      <header className="header">
        <div className="header-container">
          <img
            src="https://buscobus.com.co/wp-content/uploads/2017/05/coonorte.jpg"
            alt="Logo Coonorte"
            className="logo"
          />
        </div>
        <nav className="nav">
          <a href="/contacto" className="active">Contacto</a>
        </nav>
      </header>

      <main className="container contacto">
        <h2>Contáctanos</h2>
        <p>
          En <strong>Coonorte</strong> te ofrecemos atención personalizada en nuestra oficina de{" "}
          <strong>Andes, Antioquia</strong>. Estamos disponibles para resolver tus inquietudes sobre
          horarios, rutas y servicios.
        </p>

        <section className="info-section">
          <h3>📍 Oficina Andes</h3>
          <p><strong>Dirección:</strong> Diagonal 53 #49A-2, Andes, Antioquia</p>
          <p><strong>Teléfono / Extensión:</strong> (604) 480 15 80 Ext. 305</p>
          <p><strong>Correo electrónico:</strong> info@coonorte.com.co</p>
        </section>

        <section className="info-section">
          <h3>🕒 Horarios de atención</h3>
          <p><strong>Lunes a Miércoles:</strong> 7:00 a.m. – 5:00 p.m.</p>
          <p><strong>Jueves y Viernes:</strong> 7:00 a.m. – 4:00 p.m.</p>
          <p><strong>Sábados:</strong> 8:00 a.m. – 12:00 p.m.</p>
          <p><strong>Domingos y festivos:</strong> Atención limitada, confirmar por teléfono o WhatsApp.</p>
        </section>

        <section className="info-section">
          <h3>🌐 Redes sociales</h3>
          <p>Síguenos para conocer nuestras rutas, horarios y promociones:</p>
          <ul className="social-links">
            <li>🔵 <a href="https://www.facebook.com/coonorte" target="_blank" rel="noreferrer">Facebook: Coonorte Oficial</a></li>
            <li>📸 <a href="https://www.instagram.com/coonorte" target="_blank" rel="noreferrer">Instagram: @coonorte</a></li>
            <li>🐦 <a href="https://twitter.com/coonorte" target="_blank" rel="noreferrer">Twitter: @Coonorte</a></li>
            <li>💬 <a href="https://wa.me/573183446064" target="_blank" rel="noreferrer" className="whatsapp-link">WhatsApp: +57 318 344 6064</a></li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>© 2025 Coonorte - Cooperativa Norteña de Transportadores Ltda.</p>
        <p>Desarrollado por el equipo de sistemas de Coonorte</p>
      </footer>
    </div>
  );
};

export default Contacto;
