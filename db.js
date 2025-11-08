// db.js
import mysql from "mysql2/promise";

let conexion;

try {
  conexion = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "coonorte_bd",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await conexion.getConnection(); // prueba real
  console.log("✅ Conectado correctamente a MySQL (coonorte_bd)");
} catch (error) {
  console.error("❌ Error al conectar con MySQL:", error);
}

export default conexion;
