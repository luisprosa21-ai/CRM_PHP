-- =============================================================
-- CRM Hipotecario — Database initialisation script
-- Executed automatically by MySQL on first container start.
-- =============================================================

CREATE DATABASE IF NOT EXISTS crm_hipotecario
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE crm_hipotecario;

-- ─── 001 Users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'advisor', 'manager', 'viewer') NOT NULL DEFAULT 'advisor',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 002 Leads ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id CHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    source ENUM('web', 'phone', 'referral', 'partner', 'advertising') NOT NULL DEFAULT 'web',
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') NOT NULL DEFAULT 'new',
    assigned_to CHAR(36) NULL,
    notes TEXT,
    score DECIMAL(5,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_leads_status (status),
    INDEX idx_leads_assigned (assigned_to),
    INDEX idx_leads_source (source),
    INDEX idx_leads_email (email),
    INDEX idx_leads_created (created_at),
    CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 003 Clients ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id CHAR(36) PRIMARY KEY,
    lead_id CHAR(36) NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    document_type ENUM('dni', 'nie', 'passport') NOT NULL DEFAULT 'dni',
    document_number VARCHAR(50) NOT NULL,
    address VARCHAR(500) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    country VARCHAR(10) DEFAULT 'ES',
    employment_type VARCHAR(100) DEFAULT '',
    monthly_income DECIMAL(12,2) DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_clients_email (email),
    INDEX idx_clients_document (document_number),
    INDEX idx_clients_lead (lead_id),
    CONSTRAINT fk_clients_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 004 Expedientes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expedientes (
    id CHAR(36) PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    advisor_id CHAR(36) NOT NULL,
    property_value DECIMAL(14,2) NOT NULL,
    requested_amount DECIMAL(14,2) NOT NULL,
    term INT NOT NULL COMMENT 'Term in months',
    status ENUM('nuevo','en_estudio','documentacion_pendiente','enviado_a_banco','oferta_recibida','negociacion','aprobado','firmado','rechazado') NOT NULL DEFAULT 'nuevo',
    score DECIMAL(5,2) NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_expedientes_client (client_id),
    INDEX idx_expedientes_advisor (advisor_id),
    INDEX idx_expedientes_status (status),
    INDEX idx_expedientes_created (created_at),
    CONSTRAINT fk_expedientes_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expedientes_advisor FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 005 Offers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
    id CHAR(36) PRIMARY KEY,
    expediente_id CHAR(36) NOT NULL,
    bank_id VARCHAR(100) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    interest_rate DECIMAL(5,3) NOT NULL,
    term INT NOT NULL COMMENT 'Term in months',
    monthly_payment DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(14,2) NOT NULL,
    conditions TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    received_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,

    INDEX idx_offers_expediente (expediente_id),
    INDEX idx_offers_bank (bank_id),
    INDEX idx_offers_status (status),
    CONSTRAINT fk_offers_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 006 Tasks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id CHAR(36) PRIMARY KEY,
    expediente_id CHAR(36) NULL,
    assigned_to CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    due_date DATETIME NOT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tasks_assigned (assigned_to),
    INDEX idx_tasks_expediente (expediente_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_priority (priority),
    CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 007 Documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id CHAR(36) PRIMARY KEY,
    expediente_id CHAR(36) NOT NULL,
    client_id CHAR(36) NOT NULL,
    type ENUM('identity','payslip','tax_return','property_deed','bank_statement','appraisal','contract','other') NOT NULL DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INT UNSIGNED NOT NULL DEFAULT 0,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('uploaded', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'uploaded',
    uploaded_by CHAR(36) NOT NULL,
    verified_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_documents_expediente (expediente_id),
    INDEX idx_documents_client (client_id),
    INDEX idx_documents_type (type),
    INDEX idx_documents_status (status),
    CONSTRAINT fk_documents_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_documents_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 008 Notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    type ENUM('email', 'sms', 'push', 'internal') NOT NULL DEFAULT 'internal',
    channel VARCHAR(100) DEFAULT '',
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'read') NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 009 Audit Logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36) NOT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) DEFAULT '',
    user_agent VARCHAR(500) DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed data ──────────────────────────────────────────────
-- Password: 'Admin123!' hashed with bcrypt (cost 12)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Admin', 'Principal', 'admin', 1, NOW(), NOW()),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'carlos.garcia@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Carlos', 'García', 'advisor', 1, NOW(), NOW()),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'maria.lopez@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'María', 'López', 'advisor', 1, NOW(), NOW()),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'jefe.ventas@crm-hipotecario.com', '$2y$12$LJ3mFGOj1xMbfTHZaHzS7OSSHXEVqouLsQ8GWfv2pDzYXoD1E0GCK', 'Roberto', 'Martínez', 'manager', 1, NOW(), NOW());

INSERT INTO leads (id, full_name, email, phone, source, status, assigned_to, notes, score, created_at, updated_at) VALUES
('l1000000-0000-0000-0000-000000000001', 'Juan Pérez Ruiz', 'juan.perez@email.com', '+34612345678', 'web', 'new', NULL, 'Interesado en hipoteca para primera vivienda', NULL, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000002', 'Ana Martínez Sáez', 'ana.martinez@email.com', '+34623456789', 'phone', 'contacted', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Llamó preguntando por condiciones', 65.5, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000003', 'Pedro López Gómez', 'pedro.lopez@email.com', '+34634567890', 'referral', 'qualified', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Referido por cliente existente, buen perfil', 82.0, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000004', 'Laura Sánchez Vila', 'laura.sanchez@email.com', '+34645678901', 'partner', 'converted', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Convertida a cliente', 91.0, NOW(), NOW()),
('l1000000-0000-0000-0000-000000000005', 'Miguel Torres Ríos', 'miguel.torres@email.com', '+34656789012', 'advertising', 'lost', NULL, 'No cumple requisitos mínimos', 25.0, NOW(), NOW());

INSERT INTO clients (id, lead_id, first_name, last_name, email, phone, document_type, document_number, address, city, country, employment_type, monthly_income, created_at, updated_at) VALUES
('cl100000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000004', 'Laura', 'Sánchez Vila', 'laura.sanchez@email.com', '+34645678901', 'dni', '12345678A', 'Calle Mayor 15, 3ºB', 'Madrid', 'ES', 'permanent', 3500.00, NOW(), NOW()),
('cl100000-0000-0000-0000-000000000002', NULL, 'Francisco', 'Ruiz Pérez', 'francisco.ruiz@email.com', '+34667890123', 'nie', 'X1234567L', 'Av. Diagonal 200', 'Barcelona', 'ES', 'freelance', 4200.00, NOW(), NOW());

INSERT INTO expedientes (id, client_id, advisor_id, property_value, requested_amount, term, status, score, notes, created_at, updated_at) VALUES
('ex100000-0000-0000-0000-000000000001', 'cl100000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 250000.00, 200000.00, 300, 'en_estudio', 75.5, 'Primera vivienda, buen perfil financiero', NOW(), NOW()),
('ex100000-0000-0000-0000-000000000002', 'cl100000-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 350000.00, 280000.00, 360, 'documentacion_pendiente', 62.0, 'Autónomo, requiere documentación adicional', NOW(), NOW()),
('ex100000-0000-0000-0000-000000000003', 'cl100000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 180000.00, 120000.00, 240, 'nuevo', NULL, 'Segunda propiedad', NOW(), NOW());
