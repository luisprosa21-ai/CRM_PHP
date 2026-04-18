-- Seed data for CRM Hipotecario
-- Password: 'Admin123!' hashed with bcrypt
-- Generated via: password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12])

-- ─── Users ───────────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Admin', 'Principal', 'admin', 1, NOW(), NOW()),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'carlos.garcia@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Carlos', 'García', 'advisor', 1, NOW(), NOW()),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'maria.lopez@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'María', 'López', 'advisor', 1, NOW(), NOW()),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'jefe.ventas@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Roberto', 'Martínez', 'manager', 1, NOW(), NOW());

-- ─── Leads ───────────────────────────────────────────────────
INSERT INTO leads (id, full_name, email, phone, source, status, assigned_to, notes, score, created_at, updated_at) VALUES
('l1000000-0000-0000-0000-000000000001', 'Juan Pérez Ruiz', 'juan.perez@email.com', '+34612345678', 'web', 'new', NULL, 'Interesado en hipoteca para primera vivienda', NULL, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000002', 'Ana Martínez Sáez', 'ana.martinez@email.com', '+34623456789', 'phone', 'contacted', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Llamó preguntando por condiciones', 65.5, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000003', 'Pedro López Gómez', 'pedro.lopez@email.com', '+34634567890', 'referral', 'qualified', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Referido por cliente existente, buen perfil', 82.0, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000004', 'Laura Sánchez Vila', 'laura.sanchez@email.com', '+34645678901', 'partner', 'converted', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Convertida a cliente', 91.0, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000005', 'Miguel Torres Ríos', 'miguel.torres@email.com', '+34656789012', 'advertising', 'lost', NULL, 'No cumple requisitos mínimos', 25.0, NOW(), NOW());

-- ─── Clients ─────────────────────────────────────────────────
INSERT INTO clients (id, lead_id, first_name, last_name, email, phone, document_type, document_number, address, city, country, employment_type, monthly_income, created_at, updated_at) VALUES
('cl100000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000004', 'Laura', 'Sánchez Vila', 'laura.sanchez@email.com', '+34645678901', 'dni', '12345678A', 'Calle Mayor 15, 3ºB', 'Madrid', 'ES', 'permanent', 3500.00, NOW(), NOW()),
('cl100000-0000-0000-0000-000000000002', NULL, 'Francisco', 'Ruiz Pérez', 'francisco.ruiz@email.com', '+34667890123', 'nie', 'X1234567L', 'Av. Diagonal 200', 'Barcelona', 'ES', 'freelance', 4200.00, NOW(), NOW());

-- ─── Expedientes ─────────────────────────────────────────────
INSERT INTO expedientes (id, client_id, advisor_id, property_value, requested_amount, term, status, score, notes, created_at, updated_at) VALUES
('ex100000-0000-0000-0000-000000000001', 'cl100000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 250000.00, 200000.00, 300, 'en_estudio', 75.5, 'Primera vivienda, buen perfil financiero', NOW(), NOW()),
('ex100000-0000-0000-0000-000000000002', 'cl100000-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 350000.00, 280000.00, 360, 'documentacion_pendiente', 62.0, 'Autónomo, requiere documentación adicional', NOW(), NOW()),
('ex100000-0000-0000-0000-000000000003', 'cl100000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 180000.00, 120000.00, 240, 'nuevo', NULL, 'Segunda propiedad', NOW(), NOW());
