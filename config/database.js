import "dotenv/config";
import mysql from "mysql2";

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

db.connect((error) => {
	if (error) throw error;
	console.log("Conectada");
});

export default db;
