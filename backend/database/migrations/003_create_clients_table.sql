-- Migration: Create clients table
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
