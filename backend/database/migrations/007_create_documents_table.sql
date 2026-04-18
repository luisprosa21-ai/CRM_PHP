-- Migration: Create documents table
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
