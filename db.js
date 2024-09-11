const mysql = require("mysql2");

// Konfigurasi koneksi ke database
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "192.168.0.2",
  user: process.env.DB_USER || "DBOL",
  password: process.env.DB_PASSWORD || "Db0L347!",
  database: process.env.DB_NAME || "chat",
  port: process.env.DB_PORT || 3345,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// Koneksi ke database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

// Fungsi untuk mendapatkan data dari tabel user_ask
const getUserAsk = async () => {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM user_ask", (error, results) => {
      if (error) {
        console.error("Error fetching user ask data:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Fungsi untuk mendapatkan data dari tabel model_resp
const getModelResp = async () => {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM model_resp", (error, results) => {
      if (error) {
        console.error("Error fetching model resp data:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Fungsi untuk mendapatkan data dari tabel user_ask dan model_resp
const getUserAskAndModelResp = async () => {
  return new Promise((resolve, reject) => {
    connection.query(
      `
      SELECT user_ask.*, model_resp.text AS model_text 
      FROM user_ask
      JOIN model_resp ON user_ask.id_resp = model_resp.id
    `,
      (error, results) => {
        if (error) {
          console.error("Error fetching combined data:", error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
};

module.exports = { getUserAsk, getModelResp, getUserAskAndModelResp };
