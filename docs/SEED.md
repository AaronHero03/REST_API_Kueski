# Seed Data — kueski_db

Datos de prueba para poblar la base de datos. Todos los usuarios tienen la misma contraseña: `Kueski2024!`

---

## Usuarios de prueba

| ID  | Nombre                | Email                    | Saldo   | Cashback aprobado | Préstamos activos |
| --- | --------------------- | ------------------------ | ------- | ----------------- | ----------------- |
| 1   | Carlos Mendoza Ríos   | carlos.mendoza@gmail.com | $15,000 | $180              | 1                 |
| 2   | María García López    | maria.garcia@hotmail.com | $8,500  | $95               | 0                 |
| 3   | Roberto Torres Vargas | roberto.torres@gmail.com | $32,000 | $1,200            | 1                 |
| 4   | Ana Flores Castillo   | ana.flores@gmail.com     | $2,300  | $0                | 0                 |
| 5   | Jorge Ramírez Soto    | jorge.ramirez@yahoo.com  | $11,750 | $340              | 1                 |

---

## Script SQL

```sql
USE default_db;

-- 1. Tiendas partner
INSERT INTO tiendas_partner (nombre, dominio, cashback_rate) VALUES
  ('Liverpool',      'liverpool.com.mx',      3.00),
  ('Amazon México',  'amazon.com.mx',         2.50),
  ('Mercado Libre',  'mercadolibre.com.mx',   4.00),
  ('Walmart México', 'walmart.com.mx',        2.00),
  ('Coppel',         'coppel.com',            3.50);

-- 2. Clientes
INSERT INTO cliente (nombre, email, password) VALUES
  ('Carlos Mendoza Ríos',   'carlos.mendoza@gmail.com', 'Kueski2024!'),
  ('María García López',    'maria.garcia@hotmail.com', 'Kueski2024!'),
  ('Roberto Torres Vargas', 'roberto.torres@gmail.com', 'Kueski2024!'),
  ('Ana Flores Castillo',   'ana.flores@gmail.com',     'Kueski2024!'),
  ('Jorge Ramírez Soto',    'jorge.ramirez@yahoo.com',  'Kueski2024!');

-- 3. Cuentas
INSERT INTO cuenta (id_cliente, saldo, estado) VALUES
  (1, 15000.00, 'activa'),
  (2,  8500.00, 'activa'),
  (3, 32000.00, 'activa'),
  (4,  2300.00, 'activa'),
  (5, 11750.00, 'activa');
  (6, 2010.00, 'activa');

-- 4. Cashback
INSERT INTO cashback (id_cliente, monto_pendiente, monto_aprobado) VALUES
  (1,  250.00,  180.00),
  (2,    0.00,   95.00),
  (3,  800.00, 1200.00),
  (4,   50.00,    0.00),
  (5,  120.00,  340.00);
  (6,  20.00,  0.00);


-- 5. Solicitudes de préstamo
INSERT INTO solicitud_prestamo (id_cliente, cantidad, fecha_inicio, fecha_fin, estado) VALUES
  (1,  5000.00, '2026-01-10', '2026-04-10', 'aprobada'),
  (2,  2000.00, '2026-03-01', '2026-09-01', 'pendiente'),
  (3, 15000.00, '2025-06-01', '2026-06-01', 'aprobada'),
  (3,  8000.00, '2025-01-01', '2025-07-01', 'aprobada'),
  (4,  1000.00, '2026-02-15', '2026-05-15', 'rechazada'),
  (5,  8000.00, '2026-02-01', '2026-08-01', 'aprobada');
  (6,  2000.00, '2026-02-01', '2026-08-01', 'aprobada');

-- 6. Préstamos
INSERT INTO prestamo (id_solicitud, monto, cuotas, tasa, estado) VALUES
  (1,  5000.00,  3, 0.0800, 'activo'),
  (3, 15000.00, 12, 0.0800, 'activo'),
  (4,  8000.00,  6, 0.0800, 'pagado'),
  (6,  8000.00,  6, 0.0800, 'activo');

-- 7. Transacciones
INSERT INTO transaccion (id_cliente, id_partner, monto, fecha, estado) VALUES
  (1, 1, 1200.00, '2026-03-15 14:30:00', 'aprobado'),
  (1, 2,  850.00, '2026-04-02 10:15:00', 'aprobado'),
  (2, 3,  600.00, '2026-03-20 18:45:00', 'aprobado'),
  (3, 1, 5500.00, '2026-02-10 11:00:00', 'aprobado'),
  (3, 4, 2300.00, '2026-03-05 09:30:00', 'aprobado'),
  (3, 5, 3100.00, '2026-04-18 16:00:00', 'aprobado'),
  (4, 4,  450.00, '2026-04-10 13:20:00', 'aprobado'),
  (5, 5, 1800.00, '2026-03-28 12:00:00', 'aprobado'),
  (5, 2,  990.00, '2026-04-22 17:30:00', 'pendiente');

-- 8. Solicitudes de cashback
INSERT INTO solicitud_cb (id_transaccion, url, cantidad_CB, estado) VALUES
  (1, 'https://liverpool.com.mx/pedido/LVP-38291',     36.00, 'aprobada'),
  (2, 'https://amazon.com.mx/order/AMZ-99182',         21.25, 'aprobada'),
  (3, 'https://mercadolibre.com.mx/compra/MLC-55012',  24.00, 'pendiente'),
  (4, 'https://liverpool.com.mx/pedido/LVP-77340',    165.00, 'aprobada'),
  (5, 'https://walmart.com.mx/orden/WLM-20019',        46.00, 'aprobada'),
  (6, 'https://coppel.com/compra/COP-88123',          108.50, 'pendiente'),
  (7, 'https://walmart.com.mx/orden/WLM-30041',         9.00, 'pendiente'),
  (8, 'https://coppel.com/compra/COP-91005',           63.00, 'aprobada');

-- 9. Aprobaciones de cashback
INSERT INTO aprobacion_cb (id_SoliCB, id_transaccion, cantidad) VALUES
  (1, 1,  36.00),
  (2, 2,  21.25),
  (4, 4, 165.00),
  (5, 5,  46.00),
  (8, 8,  63.00);
```
