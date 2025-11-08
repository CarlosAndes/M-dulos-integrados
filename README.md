Sistema de Gestión de Usuarios, Ventas y Encomiendas – Backend Node.js, Express, MySQL y Socket.IO
Proyecto desarrollado como parte de la evidencia GA8-220501096-AA1-EV02 – Módulos Integrados del programa Tecnología en Análisis y Desarrollo de Software – SENA.

Descripción general
Este sistema integra tres módulos principales usados por empresas de transporte intermunicipal:

Usuarios: Registro y autenticación segura.

Ventas: Gestión de tiquetes y validación de disponibilidad de asientos.

Encomiendas: Registro, control y actualización en tiempo real.
El backend está construido en Node.js con Express, usando MySQL como base de datos relacional y Socket.IO para comunicación instantánea.

Tecnologías utilizadas
Node.js v18
Express
MySQL
MySQL Workbench
Socket.IO
bcryptjs
cors
dotenv

Requisitos previos
Node.js 16 o superior
MySQL Server instalado
Git instalado

Instalación y configuración
4.1 Clonar el repositorio
git clone https://github.com/tuusuario/turepositorio.git

cd turepositorio

4.2 Instalar dependencias
npm install

4.3 Configurar variables de entorno
Crear un archivo .env basado en .env.example con los siguientes valores:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=coonorte_bd
PORT=3000

4.4 Importar la base de datos
Desde MySQL Workbench o phpMyAdmin, importar:
schema.sql
seeds.sql (opcional)

Ejecutar el servidor
Modo desarrollo:
npm run dev

Modo producción:
npm start

Servidor disponible en:
http://localhost:3000

Estructura del proyecto
/project
index.js
db.js
package.json
README.md
routes/usuarios.js
routes/ventas.js
routes/encomiendas.js
controllers/
db/schema.sql
db/seeds.sql
.env.example

Endpoints principales
Usuarios:
POST /api/registro
POST /api/login

Ventas:
POST /api/ventas
GET /api/ventas
DELETE /api/ventas/:id

Encomiendas:
POST /api/encomiendas
GET /api/encomiendas
PUT /api/encomiendas/:id

Socket.IO – Eventos en tiempo real
nueva-compra
nueva-encomienda
Se utilizan para actualizar automáticamente las interfaces conectadas sin recargar la página.

Colección Postman
Se recomienda incluir el archivo postman_collection.json con las pruebas de los endpoints.

Estado del proyecto
Sistema funcional
Probado con Postman
Base de datos operativa
Módulos integrados y comunicación en tiempo real activa

Autor
Carlos Mario Osorio Taborda – SENA ADS

Licencia
Este proyecto es de uso académico y formativo.
