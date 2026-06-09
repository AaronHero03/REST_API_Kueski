# Setup Guide

Step-by-step instructions to run the API locally and populate the database with test data.

---

## Prerequisites

- **Node.js 18+**
- **npm**
- **MySQL 8** — local installation or a cloud host (PlanetScale, Railway, etc.)

---

## 1. Install Dependencies

```bash
cd API
npm install
```

---

## 2. Configure Environment Variables

Create a `.env` file in the `API/` directory:

```env
PORT=3000

DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=default_db

JWT_SECRET=any-long-random-string-keep-it-secret
```

> **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## 3. Create the Database Schema

Run this DDL script against your MySQL instance before seeding:

```sql
CREATE DATABASE IF NOT EXISTS default_db;
USE default_db;

CREATE TABLE cliente (
  id_cliente   INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100)  NOT NULL,
  email        VARCHAR(100)  UNIQUE NOT NULL,
  password     VARCHAR(255)  NOT NULL,
  token_session VARCHAR(500),
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuenta (
  id_cuenta  INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  saldo      DECIMAL(12,2)  DEFAULT 0.00,
  estado     ENUM('ACTIVA','INACTIVA') DEFAULT 'ACTIVA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE cashback (
  id_cashback      INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente       INT UNIQUE NOT NULL,
  monto_pendiente  DECIMAL(10,2) DEFAULT 0.00,
  monto_aprobado   DECIMAL(10,2) DEFAULT 0.00,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE solicitud_prestamo (
  id_soliPres  INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente   INT NOT NULL,
  cantidad     DECIMAL(12,2) NOT NULL,
  fecha_inicio DATE,
  fecha_fin    DATE,
  estado       ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE prestamo (
  id_prestamo  INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud INT NOT NULL,
  monto        DECIMAL(12,2) NOT NULL,
  cuotas       INT NOT NULL,
  tasa         DECIMAL(6,4) NOT NULL,
  estado       ENUM('ACTIVO','PAGADO') DEFAULT 'ACTIVO',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_solicitud) REFERENCES solicitud_prestamo(id_soliPres)
);

CREATE TABLE tiendas_partner (
  id_partner    INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  dominio       VARCHAR(100) UNIQUE NOT NULL,
  cashback_rate DECIMAL(5,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaccion (
  id_transaccion INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente     INT NOT NULL,
  id_partner     INT NOT NULL,
  monto          DECIMAL(12,2) NOT NULL,
  fecha          DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado         ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
  FOREIGN KEY (id_partner) REFERENCES tiendas_partner(id_partner)
);

CREATE TABLE solicitud_cb (
  id_SoliCB      INT AUTO_INCREMENT PRIMARY KEY,
  id_transaccion INT NOT NULL,
  url            VARCHAR(500),
  cantidad_CB    DECIMAL(10,2) NOT NULL,
  estado         ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_transaccion) REFERENCES transaccion(id_transaccion)
);

CREATE TABLE aprobacion_cb (
  id_aprob         INT AUTO_INCREMENT PRIMARY KEY,
  id_SoliCB        INT NOT NULL,
  id_transaccion   INT NOT NULL,
  cantidad         DECIMAL(10,2) NOT NULL,
  fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_SoliCB)        REFERENCES solicitud_cb(id_SoliCB),
  FOREIGN KEY (id_transaccion)   REFERENCES transaccion(id_transaccion)
);
```

---

## 4. Seed Test Data

All test users share the password **`Kueski2024!`**

### Test Users

| ID | Name | Email | Balance | Cashback | Active Loans |
| --- | --- | --- | --- | --- | --- |
| 1 | Carlos Mendoza Ríos | carlos.mendoza@gmail.com | $15,000 | $180 | 1 |
| 2 | María García López | maria.garcia@hotmail.com | $8,500 | $95 | 0 |
| 3 | Roberto Torres Vargas | roberto.torres@gmail.com | $32,000 | $1,200 | 1 |
| 4 | Ana Flores Castillo | ana.flores@gmail.com | $2,300 | $0 | 0 |
| 5 | Jorge Ramírez Soto | jorge.ramirez@yahoo.com | $11,750 | $340 | 1 |

### Partner Stores

| Domain | Store | Cashback Rate |
| --- | --- | --- |
| liverpool.com.mx | Liverpool | 3.00% |
| amazon.com.mx | Amazon México | 2.50% |
| mercadolibre.com.mx | Mercado Libre | 4.00% |
| walmart.com.mx | Walmart México | 2.00% |
| coppel.com | Coppel | 3.50% |

### Seed SQL

```sql
USE default_db;

INSERT INTO tiendas_partner (nombre, dominio, cashback_rate) VALUES
  ('Liverpool',      'liverpool.com.mx',    3.00),
  ('Amazon México',  'amazon.com.mx',       2.50),
  ('Mercado Libre',  'mercadolibre.com.mx', 4.00),
  ('Walmart México', 'walmart.com.mx',      2.00),
  ('Coppel',         'coppel.com',          3.50);

INSERT INTO cliente (nombre, email, password) VALUES
  ('Carlos Mendoza Ríos',   'carlos.mendoza@gmail.com', 'Kueski2024!'),
  ('María García López',    'maria.garcia@hotmail.com', 'Kueski2024!'),
  ('Roberto Torres Vargas', 'roberto.torres@gmail.com', 'Kueski2024!'),
  ('Ana Flores Castillo',   'ana.flores@gmail.com',     'Kueski2024!'),
  ('Jorge Ramírez Soto',    'jorge.ramirez@yahoo.com',  'Kueski2024!');

INSERT INTO cuenta (id_cliente, saldo, estado) VALUES
  (1, 15000.00, 'ACTIVA'),
  (2,  8500.00, 'ACTIVA'),
  (3, 32000.00, 'ACTIVA'),
  (4,  2300.00, 'ACTIVA'),
  (5, 11750.00, 'ACTIVA');

INSERT INTO cashback (id_cliente, monto_pendiente, monto_aprobado) VALUES
  (1,  250.00,  180.00),
  (2,    0.00,   95.00),
  (3,  800.00, 1200.00),
  (4,   50.00,    0.00),
  (5,  120.00,  340.00);

INSERT INTO solicitud_prestamo (id_cliente, cantidad, fecha_inicio, fecha_fin, estado) VALUES
  (1,  5000.00, '2026-01-10', '2026-04-10', 'aprobada'),
  (3, 15000.00, '2025-06-01', '2026-06-01', 'aprobada'),
  (5,  8000.00, '2026-02-01', '2026-08-01', 'aprobada');

INSERT INTO prestamo (id_solicitud, monto, cuotas, tasa, estado) VALUES
  (1,  5000.00,  3, 0.0800, 'ACTIVO'),
  (2, 15000.00, 12, 0.0800, 'ACTIVO'),
  (3,  8000.00,  6, 0.0800, 'ACTIVO');
```

---

## 5. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3000`.

---

## 6. Verify the Setup

```bash
# Should return Express default page (200)
curl http://localhost:3000

# Should return 400 (missing credentials)
curl -X POST http://localhost:3000/auth/login

# Successful login — copy the token from the response
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos.mendoza@gmail.com","password":"Kueski2024!"}'

# Use the token to verify session
curl http://localhost:3000/auth/verify \
  -H "Authorization: Bearer <paste-token-here>"

# Fetch dashboard
curl http://localhost:3000/users/me/dashboard \
  -H "Authorization: Bearer <paste-token-here>"
```
